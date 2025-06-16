import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { computeAndUpsertSettlements } from "../utils/computeSettlement";

export const settlementRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: groupId }) => {
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

      // Get all settlements for the group
      const settlements = await ctx.db.settlement.findMany({
        where: {
          groupId,
        },
        include: {
          from: true,
          to: true,
        },
        orderBy: {
          createdAt: "desc",
        },
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

      // Delete the settlement
      await ctx.db.settlement.delete({
        where: { id: settlementId },
      });

      return { success: true };
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

      // Delete all settlements for this group
      const result = await ctx.db.settlement.deleteMany({
        where: { groupId },
      });

      return { success: true, count: result.count };
    }),

  recompute: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: groupId }) => {
      const result = await computeAndUpsertSettlements(ctx, groupId);
      
      return result;
    }),
}); 