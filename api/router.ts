import { authRouter } from "./auth-router";
import { panelAuthRouter } from "./panel-auth-router";
import { publicRouter } from "./public-router";
import { adminRouter } from "./admin-router";
import { ownerRouter } from "./owner-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  panelAuth: panelAuthRouter,
  public: publicRouter,
  admin: adminRouter,
  owner: ownerRouter,
});

export type AppRouter = typeof appRouter;
