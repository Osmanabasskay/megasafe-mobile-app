import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { collectionsRouter } from "./routes/db/collections-router";
import { verifyRouter } from "./routes/verify/router";
import { usersRouter } from "./routes/users/router";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  db: collectionsRouter,
  verify: verifyRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;