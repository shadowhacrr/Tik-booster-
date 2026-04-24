import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = authedQuery.use(requireRole("admin"));

// Panel auth middleware
const requirePanelAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.panelUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Panel authentication required",
    });
  }

  return next({ ctx: { ...ctx, panelUser: ctx.panelUser } });
});

function requirePanelRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.panelUser || ctx.panelUser.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient panel permissions",
      });
    }

    return next({ ctx: { ...ctx, panelUser: ctx.panelUser } });
  });
}

export const panelAuthedQuery = t.procedure.use(requirePanelAuth);
export const panelOwnerQuery = panelAuthedQuery.use(requirePanelRole("owner"));
export const panelAdminQuery = panelAuthedQuery.use(requirePanelRole("admin"));
export const panelAnyRoleQuery = panelAuthedQuery;
