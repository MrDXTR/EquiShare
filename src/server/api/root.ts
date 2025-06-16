import { groupRouter } from "~/server/api/routers/group";
import { expenseRouter } from "~/server/api/routers/expense";
import { inviteRouter } from "~/server/api/routers/invite";
import { settlementRouter } from "~/server/api/routers/settlement";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  group: groupRouter,
  expense: expenseRouter,
  invite: inviteRouter,
  settlement: settlementRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
