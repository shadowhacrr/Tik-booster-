import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { authenticatePanelRequest } from "./panel/context";
import type { PanelSessionPayload } from "./panel/session";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  panelUser?: PanelSessionPayload & { id: number; isActive: string };
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // OAuth auth is optional
  }
  try {
    ctx.panelUser = await authenticatePanelRequest(opts.req.headers);
  } catch {
    // Panel auth is optional
  }
  return ctx;
}
