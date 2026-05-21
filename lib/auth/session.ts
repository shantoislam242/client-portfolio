import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const ALGO = "HS256";
const EXPIRES_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type AdminPayload = JWTPayload & { sub: "admin" };

export async function signSession(payload: AdminPayload = { sub: "admin" }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGO })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string | undefined | null): Promise<AdminPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALGO] });
    if (payload.sub !== "admin") return null;
    return payload as AdminPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRES_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
