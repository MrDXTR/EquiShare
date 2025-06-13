import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import crypto from "crypto";

export const inviteRouter = createTRPCRouter({
  // Create a new invite for a group
  createInvite: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to group and is the owner
      const group = await ctx.db.group.findFirst({
        where: {
          id: input.groupId,
          createdById: ctx.session.user.id,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to invite users to this group",
        });
      }
      
      // Check rate limiting (max 10 invites per group per day)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recentInvitesCount = await ctx.db.groupInvite.count({
        where: {
          groupId: input.groupId,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });
      
      if (recentInvitesCount >= 10) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You've reached the limit of 10 invites per day for this group",
        });
      }

      // Generate a secure token
      const inviteToken = crypto.randomBytes(32).toString("hex");
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create the invite
      const invite = await ctx.db.groupInvite.create({
        data: {
          inviteToken,
          expiresAt,
          group: {
            connect: { id: input.groupId },
          },
          invitedBy: {
            connect: { id: ctx.session.user.id },
          },
        },
        include: {
          group: {
            select: {
              name: true,
            },
          },
          invitedBy: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });

      // Format the inviteLink based on the deployment URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}/invite/${inviteToken}`;

      return {
        invite,
        inviteLink,
        inviteToken,
      };
    }),

  // Get an invite by token (public access - no authentication required)
  getInviteByToken: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.groupInvite.findUnique({
        where: {
          inviteToken: input,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              people: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          invitedBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      // Check if the invite is expired
      const now = new Date();
      if (now > invite.expiresAt) {
        // Update the invite status to EXPIRED
        await ctx.db.groupInvite.update({
          where: { id: invite.id },
          data: { status: "EXPIRED" },
        });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite has expired",
        });
      }

      // Check if the invite is already used
      if (invite.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This invite has already been ${invite.status.toLowerCase()}`,
        });
      }

      return invite;
    }),

  // Accept an invite (requires authentication)
  acceptInvite: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.groupInvite.findUnique({
        where: {
          inviteToken: input,
        },
        include: {
          group: true,
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      // Check if the invite is expired
      const now = new Date();
      if (now > invite.expiresAt) {
        await ctx.db.groupInvite.update({
          where: { id: invite.id },
          data: { status: "EXPIRED" },
        });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite has expired",
        });
      }

      // Check if the invite is pending
      if (invite.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This invite has already been ${invite.status.toLowerCase()}`,
        });
      }

      // Check if the user is already a member of this group
      const isOwner = invite.group.createdById === ctx.session.user.id;
      
      if (isOwner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already own this group",
        });
      }
      
      const isMember = await ctx.db.group.findFirst({
        where: {
          id: invite.groupId,
          members: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
      });
      
      if (isMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already a member of this group",
        });
      }

      // Accept the invite
      await ctx.db.groupInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          invitedUser: {
            connect: { id: ctx.session.user.id },
          },
        },
      });

      // Add the user to the group's members
      await ctx.db.group.update({
        where: { id: invite.groupId },
        data: {
          members: {
            connect: { id: ctx.session.user.id },
          },
        },
      });

      return { 
        success: true, 
        groupId: invite.groupId 
      };
    }),

  // Reject an invite
  rejectInvite: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.groupInvite.findUnique({
        where: {
          inviteToken: input,
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      if (invite.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This invite has already been ${invite.status.toLowerCase()}`,
        });
      }

      await ctx.db.groupInvite.update({
        where: { id: invite.id },
        data: {
          status: "REJECTED",
          invitedUser: {
            connect: { id: ctx.session.user.id },
          },
        },
      });

      return { success: true };
    }),
    
  // Get a list of invites the current user has received
  getMyInvites: protectedProcedure.query(async ({ ctx }) => {
    const invites = await ctx.db.groupInvite.findMany({
      where: {
        OR: [
          // Explicit invites to this user
          { 
            invitedUserId: ctx.session.user.id,
            status: "PENDING",
          },
          // Pending invites without an assigned user yet
          {
            invitedUserId: null,
            status: "PENDING",
            // We'll validate these when they're accessed
          },
        ]
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    return invites;
  }),
}); 