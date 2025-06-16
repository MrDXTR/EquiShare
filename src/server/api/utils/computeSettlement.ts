import { TRPCError } from "@trpc/server";
import type { PrismaClient, Person, Expense, Share } from "@prisma/client";

type Context = {
  db: PrismaClient;
  session: {
    user: {
      id: string;
    };
  };
};

// Similar to the client-side util function but adapted for server
function getWhoOwesWhom(
  balances: { personId: string; balance: number; person: { id: string; name: string } | undefined }[]
) {
  const creditors = balances
    .filter((b) => b.balance > 0 && b.person)
    .map((b) => ({ ...b }));
  const debtors = balances
    .filter((b) => b.balance < 0 && b.person)
    .map((b) => ({ ...b }));
  const transactions: { fromId: string; toId: string; amount: number }[] = [];

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;
    const amount = Math.min(-debtor.balance, creditor.balance);
    if (amount > 0.01) { // Skip very small amounts
      transactions.push({
        fromId: debtor.personId,
        toId: creditor.personId,
        amount,
      });
      debtor.balance += amount;
      creditor.balance -= amount;
    }
    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }
  return transactions;
}

export async function computeAndUpsertSettlements(ctx: Context, groupId: string) {
  // First check if user has access to this group
  const group = await ctx.db.group.findFirst({
    where: {
      id: groupId,
      OR: [
        { createdById: ctx.session.user.id },
        { members: { some: { id: ctx.session.user.id } } },
      ],
    },
  });

  if (!group) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this group",
    });
  }

  // Get all unsettled expenses and calculate balances
  const groupWithExpenses = await ctx.db.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      people: true,
      expenses: {
        include: {
          paidBy: true,
          shares: {
            include: {
              person: true,
            },
          },
        },
      },
    },
  });

  if (!groupWithExpenses) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Group not found",
    });
  }

  // Calculate balances from expenses
  const balances = new Map<string, number>();
  groupWithExpenses.people.forEach((person: Person) => {
    balances.set(person.id, 0);
  });

  type ExpenseWithRelations = Expense & {
    paidBy: Person;
    shares: (Share & { person: Person })[];
  };

  groupWithExpenses.expenses.forEach((expense: ExpenseWithRelations) => {
    // Add amount to payer's balance
    const currentPayerBalance = balances.get(expense.paidById) ?? 0;
    balances.set(expense.paidById, currentPayerBalance + expense.amount);

    // Subtract share amount from each person's balance
    expense.shares.forEach((share) => {
      const currentBalance = balances.get(share.personId) ?? 0;
      balances.set(share.personId, currentBalance - share.amount);
    });
  });

  // Create balance objects for getWhoOwesWhom
  const balanceObjects = Array.from(balances.entries())
    .filter(([_, balance]) => Math.abs(balance) > 0.01) // Filter out zero or very small balances
    .map(([personId, balance]) => ({
      personId,
      balance,
      person: groupWithExpenses.people.find((p: Person) => p.id === personId),
    }));

  // Get minimal set of transactions
  const transactions = getWhoOwesWhom(balanceObjects);
  
  // Get existing settled settlements to preserve them
  const existingSettledSettlements = await ctx.db.settlement.findMany({
    where: {
      groupId,
      settled: true,
    },
    select: {
      id: true
    }
  });
  
  // Delete only unsettled settlements for this group
  await ctx.db.settlement.deleteMany({
    where: {
      groupId,
      settled: false,
    },
  });

  // Create new settlements
  if (transactions.length > 0) {
    await ctx.db.settlement.createMany({
      data: transactions.map((tx) => ({
        groupId,
        fromId: tx.fromId,
        toId: tx.toId,
        amount: tx.amount,
        settled: false,
      })),
    });
  }

  return { 
    success: true, 
    settlementsCount: transactions.length,
    settledSettlementsCount: existingSettledSettlements.length
  };
} 