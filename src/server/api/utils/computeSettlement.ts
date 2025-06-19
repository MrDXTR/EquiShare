import { TRPCError } from "@trpc/server";
import type {
  PrismaClient,
  Person,
  Expense,
  Share,
  Settlement,
} from "@prisma/client";

type Ctx = {
  db: PrismaClient;
  session: { user: { id: string } };
};

/* ------------------------------------------------------------------ */
/* 1. helper – minimal transaction algo (server variant)              */
/* ------------------------------------------------------------------ */
function minTx(
  rows: { id: string; name: string; bal: number }[],
): { fromId: string; toId: string; amount: number }[] {
  const creditors = rows.filter((r) => r.bal > 0).map((r) => ({ ...r }));
  const debtors = rows.filter((r) => r.bal < 0).map((r) => ({ ...r }));
  const tx: { fromId: string; toId: string; amount: number }[] = [];

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    if (!d || !c) break; // concise guard
    const amt = Math.min(-d.bal, c.bal);
    if (amt > 0.01) {
      tx.push({ fromId: d.id, toId: c.id, amount: amt });
      d.bal += amt;
      c.bal -= amt;
    }
    if (Math.abs(d.bal) < 0.01) i++;
    if (Math.abs(c.bal) < 0.01) j++;
  }
  return tx;
}

/* ------------------------------------------------------------------ */
/* 2. MAIN ENTRY POINT                                                */
/* ------------------------------------------------------------------ */
export async function computeAndUpsertSettlements(ctx: Ctx, groupId: string) {
  /* -------------------------------------------------------------- */
  /* Guard – membership / ownership                                 */
  /* -------------------------------------------------------------- */
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

  /* -------------------------------------------------------------- */
  /* Pull everything we need in one round trip                      */
  /* -------------------------------------------------------------- */
  const g = await ctx.db.group.findUnique({
    where: { id: groupId },
    include: {
      people: true,
      expenses: {
        include: {
          paidBy: true,
          shares: { include: { person: true } },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      settlements: true, // we'll split into settled / unsettled later
    },
  });
  if (!g) throw new TRPCError({ code: "NOT_FOUND" });

  /* -------------------------------------------------------------- */
  /* 2a.  Build per-person balance from *expenses only*             */
  /* -------------------------------------------------------------- */
  const bal = new Map<string, number>();
  g.people.forEach((p) => bal.set(p.id, 0));

  type X = Expense & { shares: (Share & { person: Person })[] };
  g.expenses.forEach((e: X) => {
    bal.set(e.paidById, (bal.get(e.paidById) ?? 0) + e.amount);
    e.shares.forEach((s) =>
      bal.set(s.personId, (bal.get(s.personId) ?? 0) - s.amount),
    );
  });

  /* -------------------------------------------------------------- */
  /* 2b.  Apply every *settled* row: money already transferred      */
  /* -------------------------------------------------------------- */
  g.settlements
    .filter((s) => s.settled)
    .forEach((s: Settlement) => {
      // debtor paid → raise his balance
      bal.set(s.fromId, (bal.get(s.fromId) ?? 0) + s.amount);
      // creditor received → lower her balance
      bal.set(s.toId, (bal.get(s.toId) ?? 0) - s.amount);
    });

  /* -------------------------------------------------------------- */
  /* 3.  Convert balances → minimal new transactions                */
  /* -------------------------------------------------------------- */
  const rows = Array.from(bal.entries())
    .filter(([, v]) => Math.abs(v) > 0.01)
    .map(([id, v]) => ({
      id,
      name: g.people.find((p) => p.id === id)!.name,
      bal: v,
    }));

  const newTx = minTx(rows); // what is STILL owed (unsettled)

  /* -------------------------------------------------------------- */
  /* 4.  Replace every old "unsettled" row with the fresh set       */
  /* -------------------------------------------------------------- */

  // Track person-to-person pairs to find originating expense
  const pairToFirstExpense = new Map<string, string>();

  // For each expense, check if it creates a debt between people
  g.expenses.forEach((expense) => {
    const { paidById } = expense;
    expense.shares.forEach((share) => {
      if (share.personId !== paidById) {
        // This expense creates a debt from share.personId to paidById
        const pairKey = `${share.personId}-${paidById}`;
        if (!pairToFirstExpense.has(pairKey)) {
          pairToFirstExpense.set(pairKey, expense.id);
        }
      }
    });
  });

  // Build a set of settled pairs (fromId-toId) to prevent re-creating unsettled settlements for already settled pairs
  const settledPairs = new Set<string>();
  g.settlements
    .filter((s) => s.settled)
    .forEach((s) => {
      settledPairs.add(`${s.fromId}-${s.toId}`);
    });

  await ctx.db.$transaction([
    ctx.db.settlement.deleteMany({ where: { groupId, settled: false } }),
    ...(newTx.length
      ? [
          ctx.db.settlement.createMany({
            data: newTx
              .filter((t) => {
                // Only create unsettled settlement if this pair is not already settled
                const pairKey = `${t.fromId}-${t.toId}`;
                return !settledPairs.has(pairKey);
              })
              .map((t) => {
                // Find the first expense that caused this from->to pair
                const pairKey = `${t.fromId}-${t.toId}`;
                const expenseId =
                  pairToFirstExpense.get(pairKey) || g.expenses[0]?.id;

                if (!expenseId) {
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Could not find a valid expense for settlement",
                  });
                }

                return {
                  groupId,
                  fromId: t.fromId,
                  toId: t.toId,
                  amount: t.amount,
                  settled: false,
                  expenseId,
                };
              }),
          }),
        ]
      : []),
  ]);

  const sums = await ctx.db.settlement.groupBy({
    by: ["expenseId"],
    where: {
      groupId,
      settled: true,
    },
    _sum: { amount: true },
  });

  const sumMap = new Map<string, number>();
  sums.forEach((s) => {
  
    sumMap.set(s.expenseId, (s._sum.amount ?? 0) as unknown as number);
  });

  const expenseUpdatePromises = g.expenses.map((exp) =>
    ctx.db.expense.update({
      where: { id: exp.id },
      data: { settledAmount: sumMap.get(exp.id) ?? 0 },
    }),
  );

  await ctx.db.$transaction(expenseUpdatePromises);

  return { success: true, newUnsettled: newTx.length };
}
