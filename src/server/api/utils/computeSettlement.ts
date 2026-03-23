import { TRPCError } from "@trpc/server";
import type { PrismaClient, Person, Expense, Share, Settlement } from "@prisma/client";

type Ctx = {
  db: PrismaClient;
  session: { user: { id: string } };
};

type ExpenseWithShares = Pick<Expense, "id" | "amount" | "paidById"> & {
  shares: Pick<Share, "personId" | "amount">[];
};

type SettlementLedgerEntry = Pick<
  Settlement,
  "amount" | "fromId" | "toId" | "settled" | "expenseId"
>;

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function fromCents(cents: number) {
  return Math.round(cents) / 100;
}

export function buildGroupBalances(
  people: Pick<Person, "id" | "name">[],
  expenses: ExpenseWithShares[],
  settlements: SettlementLedgerEntry[],
) {
  const balances = new Map<string, number>();
  people.forEach((person) => balances.set(person.id, 0));

  expenses.forEach((expense) => {
    balances.set(
      expense.paidById,
      (balances.get(expense.paidById) ?? 0) + toCents(expense.amount),
    );

    expense.shares.forEach((share) => {
      balances.set(
        share.personId,
        (balances.get(share.personId) ?? 0) - toCents(share.amount),
      );
    });
  });

  settlements
    .filter((settlement) => settlement.settled)
    .forEach((settlement) => {
      const amountInCents = toCents(settlement.amount);
      balances.set(
        settlement.fromId,
        (balances.get(settlement.fromId) ?? 0) + amountInCents,
      );
      balances.set(
        settlement.toId,
        (balances.get(settlement.toId) ?? 0) - amountInCents,
      );
    });
  return balances;
}

function minTx(
  rows: { id: string; name: string; bal: number }[],
): { fromId: string; toId: string; amount: number }[] {
  const creditors = rows.filter((r) => r.bal > 0).sort((a, b) => b.bal - a.bal);
  const debtors = rows.filter((r) => r.bal < 0).sort((a, b) => a.bal - b.bal);
  const tx: { fromId: string; toId: string; amount: number }[] = [];

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    if (!d || !c) break;

    const amt = Math.min(-d.bal, c.bal);
    if (amt > 0) {
      tx.push({ fromId: d.id, toId: c.id, amount: fromCents(amt) });
      d.bal += amt;
      c.bal -= amt;
    }

    if (d.bal === 0) i++;
    if (c.bal === 0) j++;
  }
  return tx;
}

function buildPairAnchors(expenses: ExpenseWithShares[]) {
  const pairToLatestExpense = new Map<string, string>();

  expenses.forEach((expense) => {
    expense.shares.forEach((share) => {
      if (share.personId === expense.paidById) {
        return;
      }

      pairToLatestExpense.set(`${share.personId}-${expense.paidById}`, expense.id);
      pairToLatestExpense.set(`${expense.paidById}-${share.personId}`, expense.id);
    });
  });

  return pairToLatestExpense;
}

export async function computeAndUpsertSettlements(ctx: Ctx, groupId: string) {
  // Access check
  const ok = await ctx.db.group.findFirst({
    where: {
      id: groupId,
      OR: [
        { createdById: ctx.session.user.id },
        { members: { some: { id: ctx.session.user.id } } },
      ],
    },
    select: { id: true },
  });
  if (!ok) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No access" });
  }

  const g = await ctx.db.group.findUnique({
    where: { id: groupId },
    include: {
      people: true,
      expenses: {
        include: {
          paidBy: true,
          shares: { include: { person: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      settlements: true,
    },
  });
  if (!g) throw new TRPCError({ code: "NOT_FOUND" });

  const balances = buildGroupBalances(
    g.people,
    g.expenses as ExpenseWithShares[],
    g.settlements,
  );
  const rows = Array.from(balances.entries())
    .filter(([, value]) => value !== 0)
    .map(([id, value]) => ({
      id,
      name: g.people.find((person) => person.id === id)?.name ?? "",
      bal: value,
    }));

  const newTx = minTx(rows);
  const pairAnchors = buildPairAnchors(g.expenses as ExpenseWithShares[]);
  const fallbackExpenseId = g.expenses[g.expenses.length - 1]?.id;

  if (newTx.length > 0 && !fallbackExpenseId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not find an expense to anchor settlements",
    });
  }

  await ctx.db.$transaction(async (tx) => {
    await tx.settlement.deleteMany({ where: { groupId, settled: false } });

    if (newTx.length && fallbackExpenseId) {
      await tx.settlement.createMany({
        data: newTx.map((transfer) => ({
          groupId,
          fromId: transfer.fromId,
          toId: transfer.toId,
          amount: transfer.amount,
          settled: false,
          expenseId:
            pairAnchors.get(`${transfer.fromId}-${transfer.toId}`) ??
            fallbackExpenseId,
        })),
      });
    }

    const expenseUpdatePromises = g.expenses.map((exp) =>
      tx.expense.update({
        where: { id: exp.id },
        data: { settledAmount: 0 },
      }),
    );

    if (expenseUpdatePromises.length) {
      await Promise.all(expenseUpdatePromises);
    }
  });

  return { success: true, newUnsettled: newTx.length };
}
