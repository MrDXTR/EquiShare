import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { computeAndUpsertSettlements } from "../utils/computeSettlement";

// Define a schema for expense share types
const shareSchema = z.object({
  personId: z.string(),
  type: z.enum(["EQUAL", "PERCENT", "EXACT"]),
  value: z.number().optional(),
});

export const expenseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        description: z.string().min(1),
        amount: z.number().positive(),
        paidById: z.string(),
        shares: z.array(shareSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { groupId, description, amount, paidById, shares } = input;
      
      // Calculate share amounts based on type
      const sharesWithAmount = shares.map((share) => {
        let shareAmount: number;
        
        switch (share.type) {
          case "EQUAL": {
            const equalCount = shares.filter(s => s.type === "EQUAL").length;
            shareAmount = equalCount > 0 ? amount / equalCount : 0;
            break;
          }
          case "PERCENT": {
            if (share.value === undefined) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Percentage value is required for PERCENT share type",
              });
            }
            shareAmount = amount * (share.value / 100);
            break;
          }
          case "EXACT": {
            if (share.value === undefined) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Amount value is required for EXACT share type",
              });
            }
            shareAmount = share.value;
            break;
          }
        }
        
        return {
          personId: share.personId,
          amount: shareAmount,
        };
      });
      
      // Validate that share total equals expense amount (with small tolerance for floating point)
      const totalShares = sharesWithAmount.reduce((sum, share) => sum + share.amount, 0);
      if (Math.abs(totalShares - amount) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Total shares must equal expense amount",
        });
      }

      const expense = await ctx.db.expense.create({
        data: {
          description,
          amount,
          groupId,
          paidById,
          shares: {
            create: sharesWithAmount,
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

      // Recompute settlements after creating an expense
      await computeAndUpsertSettlements(ctx, groupId);

      return expense;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Get the groupId before deleting the expense
      const expense = await ctx.db.expense.findUnique({
        where: { id: input },
        select: { groupId: true },
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }
      
      // Delete settlements first, then delete the expense
      await ctx.db.settlement.deleteMany({ 
        where: { expenseId: input } 
      });
      
      await ctx.db.expense.delete({
        where: {
          id: input,
        },
      });

      // Recompute settlements after deleting an expense
      await computeAndUpsertSettlements(ctx, expense.groupId);

      return { success: true };
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

      // If there are no expenses, return empty balances
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
