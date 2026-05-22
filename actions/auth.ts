"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  setSessionCookie,
  signSession,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Invalid credentials" };

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) return { error: "Server misconfigured" };

  const emailOk =
    parsed.data.email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  const passwordOk = emailOk
    ? await verifyPassword(parsed.data.password, adminHash)
    : false;

  if (!emailOk || !passwordOk) return { error: "Invalid credentials" };

  const token = await signSession({ sub: "admin" });
  await setSessionCookie(token);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
