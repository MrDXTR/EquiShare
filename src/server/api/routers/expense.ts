import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

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

  settleUp: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.update({
        where: {
          id: input,
        },
        data: {
          settled: true,
        },
      });
      return expense;
    }),

  getBalances: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // First check if user has access to this group (owner or member)
      const group = await ctx.db.group.findFirst({
        where: {
          id: input,
          OR: [
            { createdById: ctx.session.user.id },
            { members: { some: { id: ctx.session.user.id } } },
          ],
        },
        include: {
          people: true,
          expenses: {
            where: {
              settled: false, // Only consider unsettled expenses for balances
            },
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

      if (!group) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this group",
        });
      }

      // If there are no unsettled expenses, return empty balances
      if (group.expenses.length === 0) {
        return [];
      }

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

      // Filter out zero balances to avoid showing settled people
      return Array.from(balances.entries())
        .filter(([_, balance]) => Math.abs(balance) > 0.01) // Filter out zero or very small balances
        .map(([personId, balance]) => ({
          personId,
          balance,
          person: group.people.find((p) => p.id === personId),
        }));
    }),
});
