"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { getSiteSettings } from "@/lib/db/site-settings";
import { ContactFormSchema } from "@/lib/schemas/contact-form";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
} from "@/lib/rate-limit";
import { getResend } from "@/lib/email/resend";
import { contactNotification } from "@/lib/email/templates";

export type ContactFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
};

const FROM_ADDRESS = "Portfolio <onboarding@resend.dev>";

async function sendNotificationEmail(
  parsed: { name: string; email: string; message: string },
  ipAddress: string | null,
  userAgent: string | null,
  receivedAt: Date,
): Promise<void> {
  const to = process.env.NOTIFICATION_EMAIL;
  if (!to) {
    console.warn(
      "[contact-form] NOTIFICATION_EMAIL is not set — skipping email send.",
    );
    return;
  }
  const tpl = contactNotification({
    name: parsed.name,
    email: parsed.email,
    message: parsed.message,
    ipAddress,
    userAgent,
    receivedAt,
  });
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    replyTo: parsed.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const settings = await getSiteSettings();
  const successMessage = settings.contactSuccessMessage;

  // 1. Honeypot — bots fill this field, humans never see it.
  const honeypot = formData.get("_gotcha");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return { ok: true, message: successMessage };
  }

  // 2. Validate
  const parsed = ContactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    const fieldErrors: ContactFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "email" || key === "message") {
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  // 3. IP + UA
  const ip = await getClientIp();
  const userAgent = await getUserAgent();

  // 4. Rate limit
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return {
      ok: false,
      message: "Too many submissions. Please try again later.",
    };
  }

  // 5. DB write (authoritative)
  try {
    await prisma.contactSubmission.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        ipAddress: ip === "unknown" ? null : ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[contact-form] DB write failed:", err);
    return {
      ok: false,
      message: "Something went wrong. Please try again.",
    };
  }

  // 6. Notification (best-effort)
  try {
    await sendNotificationEmail(parsed.data, ip, userAgent, new Date());
  } catch (err) {
    console.error("[contact-form] Notification email failed:", err);
  }

  // 7. Revalidate admin inbox
  revalidatePath("/admin/contact-submissions");

  // 8. Success
  return { ok: true, message: successMessage };
}
