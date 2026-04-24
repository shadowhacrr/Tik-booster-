import * as cookie from "cookie";
import { verifyPanelSessionToken, PANEL_COOKIE_NAME } from "./session";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";
import { eq } from "drizzle-orm";
import type { PanelSessionPayload } from "./session";

export interface PanelContext {
  panelUser?: PanelSessionPayload & { id: number; isActive: string };
}

export async function authenticatePanelRequest(headers: Headers): Promise<PanelContext["panelUser"]> {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[PANEL_COOKIE_NAME];
  if (!token) return undefined;

  const claim = await verifyPanelSessionToken(token);
  if (!claim) return undefined;

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.admins)
    .where(eq(schema.admins.id, claim.adminId))
    .limit(1);

  const admin = rows.at(0);
  if (!admin || admin.isActive !== "true") return undefined;

  return {
    id: admin.id,
    adminId: admin.id,
    username: admin.username,
    role: admin.role,
    isActive: admin.isActive,
  };
}
