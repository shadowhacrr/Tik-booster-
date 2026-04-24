import * as cookie from "cookie";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createRouter, publicQuery, panelAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { signPanelSessionToken, PANEL_COOKIE_NAME } from "./panel/session";
import { getSessionCookieOptions } from "./lib/cookies";

export const panelAuthRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.username, input.username))
        .limit(1);

      const admin = rows.at(0);
      if (!admin || admin.password !== input.password || admin.isActive !== "true") {
        throw new Error("Invalid username or password");
      }

      const token = await signPanelSessionToken({
        adminId: admin.id,
        username: admin.username,
        role: admin.role,
      });

      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(PANEL_COOKIE_NAME, token, {
          httpOnly: cookieOpts.httpOnly,
          path: cookieOpts.path,
          sameSite: cookieOpts.sameSite?.toLowerCase() as "lax" | "none",
          secure: cookieOpts.secure,
          maxAge: 30 * 24 * 60 * 60,
        }),
      );

      return {
        success: true,
        user: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          paymentMethod: admin.paymentMethod,
          paymentNumber: admin.paymentNumber,
          paymentName: admin.paymentName,
          referralCode: admin.referralCode,
        },
      };
    }),

  me: panelAuthedQuery.query((opts) => {
    return {
      id: opts.ctx.panelUser!.id,
      username: opts.ctx.panelUser!.username,
      role: opts.ctx.panelUser!.role,
    };
  }),

  logout: panelAuthedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(PANEL_COOKIE_NAME, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
