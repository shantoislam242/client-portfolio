export type ContactNotificationInput = {
  name: string;
  email: string;
  message: string;
  ipAddress: string | null;
  userAgent: string | null;
  receivedAt: Date;
};

export type EmailPayload = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function contactNotification(
  input: ContactNotificationInput,
): EmailPayload {
  const { name, email, message, ipAddress, userAgent, receivedAt } = input;

  const subject = `New contact: ${name}`;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);
  const safeIp = ipAddress ? escapeHtml(ipAddress) : "unknown";
  const safeUa = userAgent ? escapeHtml(userAgent) : "unknown";
  const timestamp = receivedAt.toISOString();

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;">
      <h1 style="margin:0 0 16px 0;font-size:18px;font-weight:600;">New contact form submission</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#666;width:80px;">Name</td>
          <td style="padding:8px 0;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#0066ff;text-decoration:none;">${safeEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;vertical-align:top;">Message</td>
          <td style="padding:8px 0;white-space:pre-wrap;">${safeMessage}</td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <div style="font-size:12px;color:#999;line-height:1.6;">
        Received: ${escapeHtml(timestamp)}<br>
        IP: ${safeIp}<br>
        User-Agent: ${safeUa}
      </div>
    </div>
  </body>
</html>`;

  const text = [
    `New contact form submission`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Message:`,
    message,
    ``,
    `---`,
    `Received: ${timestamp}`,
    `IP: ${ipAddress ?? "unknown"}`,
    `User-Agent: ${userAgent ?? "unknown"}`,
  ].join("\n");

  return { subject, html, text };
}
