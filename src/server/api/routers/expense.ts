import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const expenseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        description: z.string().min(1),
        amount: z.number().positive(),
        paidById: z.string(),
        shareIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shareAmount = input.amount / input.shareIds.length;

      const expense = await ctx.db.expense.create({
        data: {
          description: input.description,
          amount: input.amount,
          groupId: input.groupId,
          paidById: input.paidById,
          shares: {
            create: input.shareIds.map((personId) => ({
              amount: shareAmount,
              personId,
            })),
          },
        },
        include: {
          paidBy: true,
          shares: {
            include: {
              person: true,
            },
          },
        },
      });
      return expense;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.expense.delete({
        where: {
          id: input,
        },
      });
      return { success: true };
    }),

  getBalances: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: {
          id: input,
          createdById: ctx.session.user.id,
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

      if (!group) return null;

      const balances = new Map<string, number>();
      group.people.forEach((person) => {
        balances.set(person.id, 0);
      });

      group.expenses.forEach((expense) => {
        // Add amount to payer's balance
        const currentPayerBalance = balances.get(expense.paidById) ?? 0;
        balances.set(expense.paidById, currentPayerBalance + expense.amount);

        // Subtract share amount from each person's balance
        expense.shares.forEach((share) => {
          const currentBalance = balances.get(share.personId) ?? 0;
          balances.set(share.personId, currentBalance - share.amount);
        });
      });

      return Array.from(balances.entries()).map(([personId, balance]) => ({
        personId,
        balance,
        person: group.people.find((p) => p.id === personId),
      }));
    }),
}); 