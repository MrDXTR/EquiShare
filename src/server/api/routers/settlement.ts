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
      await ctx.db.$executeRaw`
        UPDATE "Expense" e
        SET "settledAmount" = COALESCE(
          (SELECT SUM(s."amount") 
           FROM "Settlement" s 
           WHERE s."expenseId" = e.id AND s.settled = true
          ), 0)
        WHERE e.id = ${updatedSettlement.expenseId}`;

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
      await ctx.db.$executeRaw`
        UPDATE "Expense" e
        SET "settledAmount" = COALESCE(
          (SELECT SUM(s."amount") 
           FROM "Settlement" s 
           WHERE s."expenseId" = e.id AND s.settled = true
          ), 0)
        WHERE e."groupId" = ${groupId}`;

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
