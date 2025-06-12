import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
    return groups;
  }),

  getById: protectedProcedure
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
      return group;
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
      // First verify that the group belongs to the user
      const group = await ctx.db.group.findUnique({
        where: {
          id: input.groupId,
          createdById: ctx.session.user.id,
        },
      });

      if (!group) {
        throw new Error("Group not found or unauthorized");
      }

      await ctx.db.person.delete({
        where: {
          id: input.personId,
          groupId: input.groupId,
        },
      });
      return { success: true };
    }),
});
