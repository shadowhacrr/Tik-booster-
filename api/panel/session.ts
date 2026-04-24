import * as jose from "jose";
import { env } from "../lib/env";

export interface PanelSessionPayload {
  adminId: number;
  username: string;
  role: string;
}

const JWT_ALG = "HS256";
const PANEL_COOKIE_NAME = "panel_sid";

export async function signPanelSessionToken(
  payload: PanelSessionPayload,
): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret + "_panel");
  return new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyPanelSessionToken(
  token: string,
): Promise<PanelSessionPayload | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret + "_panel");
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    const { adminId, username, role } = payload as unknown as PanelSessionPayload;
    if (!adminId || !username || !role) return null;
    return { adminId: Number(adminId), username, role };
  } catch {
    return null;
  }
}

export { PANEL_COOKIE_NAME };
