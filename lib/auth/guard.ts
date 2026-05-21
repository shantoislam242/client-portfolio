import { redirect } from "next/navigation";
import { getSessionCookie, verifySession, type AdminPayload } from "./session";

export async function getAdminSession(): Promise<AdminPayload | null> {
  const token = await getSessionCookie();
  return verifySession(token);
}

export async function requireAdmin(): Promise<AdminPayload> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
