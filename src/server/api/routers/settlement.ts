import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { computeAndUpsertSettlements } from "../utils/computeSettlement";

export const settlementRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { groupId } = input;

      // Check if user has access to this group
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

      // Get all settlements for the group (both settled and unsettled)
      const settlements = await ctx.db.settlement.findMany({
        where: {
          groupId,
        },
        include: {
          from: true,
          to: true,
          expense: {
            select: {
              description: true,
            },
          },
        },
        orderBy: [
          { settled: "asc" }, // unsettled (false) first
          { createdAt: "desc" },
        ],
      });

      return settlements;
    }),

  settle: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: settlementId }) => {
      // Find the settlement and verify group access
      const settlement = await ctx.db.settlement.findUnique({
        where: { id: settlementId },
        include: { group: true },
      });

      if (!settlement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Settlement not found",
        });
      }

      // Check if user has access to the group this settlement belongs to
      const hasAccess = await ctx.db.group.findFirst({
        where: {
          id: settlement.groupId,
          OR: [
            { createdById: ctx.session.user.id },
            { members: { some: { id: ctx.session.user.id } } },
          ],
        },
      });

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this group",
        });
      }

      // Mark the settlement as settled instead of deleting it
      const updatedSettlement = await ctx.db.settlement.update({
        where: { id: settlementId },
        data: { settled: true },
      });

      // Update the expense's settledAmount
      const agg = await ctx.db.settlement.aggregate({
        where: { expenseId: updatedSettlement.expenseId, settled: true },
        _sum: { amount: true },
      });

      await ctx.db.expense.update({
        where: { id: updatedSettlement.expenseId },
        data: { settledAmount: agg._sum.amount ?? 0 },
      });

      // Recompute settlements after settling one
      await computeAndUpsertSettlements(ctx, settlement.groupId);

      return { success: true, settlement: updatedSettlement };
    }),

  settleAll: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: groupId }) => {
      // Check if user has access to this group
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

      // Mark all settlements as settled instead of deleting them
      const result = await ctx.db.settlement.updateMany({
        where: {
          groupId,
          settled: false,
        },
        data: { settled: true },
      });

      // Update all expenses' settledAmount in this group
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
        // @ts-ignore Prisma decimal support – pass through value
        sumMap.set(s.expenseId, (s._sum.amount ?? 0) as unknown as number);
      });

      const groupExpenses = await ctx.db.expense.findMany({
        where: { groupId },
        select: { id: true },
      });

      const updatePromises = groupExpenses.map((exp) =>
        ctx.db.expense.update({
          where: { id: exp.id },
          data: { settledAmount: sumMap.get(exp.id) ?? 0 },
        }),
      );

      await ctx.db.$transaction(updatePromises);

      // Recompute settlements after settling all
      await computeAndUpsertSettlements(ctx, groupId);

      return { success: true, count: result.count };
    }),

  recompute: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: groupId }) => {
      const result = await computeAndUpsertSettlements(ctx, groupId);

      return result;
    }),
});
