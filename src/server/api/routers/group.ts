import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        people: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.create({
        data: {
          name: input.name,
          createdById: ctx.session.user.id,
          people: {
            create: input.people.map((name) => ({
              name,
            })),
          },
        },
        include: {
          people: true,
        },
      });
      return group;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const groups = await ctx.db.group.findMany({
      where: {
        OR: [
          {
            createdById: ctx.session.user.id,
          },
          {
            members: {
              some: {
                id: ctx.session.user.id,
              },
            },
          },
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
        members: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    return groups;
  }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: {
          id: input,
        },
        select: {
          id: true,
          name: true,
          createdById: true,
          people: true,
          expenses: {
            select: {
              id: true,
              description: true,
              amount: true,
              settledAmount: true,
              paidBy: true,
              shares: {
                include: {
                  person: true,
                },
              },
            },
          },
          members: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      // Check if user has access to this group (owner or member)
      const isOwner = group.createdById === ctx.session.user.id;
      const isMember = group.members.some(
        (member) => member.id === ctx.session.user.id,
      );

      if (!isOwner && !isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this group",
        });
      }

      return {
        ...group,
        isOwner,
        isMember,
      };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.group.delete({
        where: {
          id: input,
          createdById: ctx.session.user.id,
        },
      });
      return { success: true };
    }),

  addPerson: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the user has access to this group (owner or member)
      const group = await ctx.db.group.findFirst({
        where: {
          id: input.groupId,
          OR: [
            { createdById: ctx.session.user.id },
            { members: { some: { id: ctx.session.user.id } } },
          ],
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this group",
        });
      }

      const person = await ctx.db.person.create({
        data: {
          name: input.name,
          groupId: input.groupId,
        },
      });
      return person;
    }),

  deletePerson: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        personId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the user has access to this group (owner or member)
      const group = await ctx.db.group.findFirst({
        where: {
          id: input.groupId,
          OR: [
            { createdById: ctx.session.user.id },
            { members: { some: { id: ctx.session.user.id } } },
          ],
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this group",
        });
      }

      await ctx.db.person.delete({
        where: {
          id: input.personId,
          groupId: input.groupId,
        },
      });
      return { success: true };
    }),

  checkGroupAccess: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: groupId }) => {
      const group = await ctx.db.group.findFirst({
        where: {
          id: groupId,
          OR: [
            { createdById: ctx.session.user.id },
            { members: { some: { id: ctx.session.user.id } } },
          ],
        },
        select: {
          id: true,
          createdById: true,
        },
      });

      if (!group) {
        return { hasAccess: false, isOwner: false };
      }

      return {
        hasAccess: true,
        isOwner: group.createdById === ctx.session.user.id,
      };
    }),

  leaveGroup: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: groupId }) => {
      // You can only leave groups you're a member of, not groups you own
      const group = await ctx.db.group.findFirst({
        where: {
          id: groupId,
          members: { some: { id: ctx.session.user.id } },
          NOT: { createdById: ctx.session.user.id }, // Can't leave groups you own
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot leave this group",
        });
      }

      await ctx.db.group.update({
        where: { id: groupId },
        data: {
          members: {
            disconnect: { id: ctx.session.user.id },
          },
        },
      });

      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        memberId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the current user is the owner of the group
      const group = await ctx.db.group.findFirst({
        where: {
          id: input.groupId,
          createdById: ctx.session.user.id,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the group owner can remove members",
        });
      }

      // Check if trying to remove the owner
      if (input.memberId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself as the owner",
        });
      }

      // Remove the member from the group
      await ctx.db.group.update({
        where: { id: input.groupId },
        data: {
          members: {
            disconnect: { id: input.memberId },
          },
        },
      });

      return { success: true };
    }),
});
