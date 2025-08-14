// lib/email.ts
import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

export async function sendPrivateShareEmail(opts: {
  to: string[];
  linkUrl: string;
  videoTitle: string;
  expiresAt: Date | null;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing; skipping email send");
    return;
  }
  const subject = `A private video was shared with you`;
  const expires = opts.expiresAt ? new Date(opts.expiresAt).toLocaleString() : "No expiry (forever)";
  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">You’ve been granted access to a video</h2>
      <p><strong>Title:</strong> ${escapeHtml(opts.videoTitle || "Untitled")}</p>
      <p><strong>Expires:</strong> ${expires}</p>
      <p><a href="${opts.linkUrl}">Open the video</a></p>
      <p style="color:#666">If you didn’t expect this, you can ignore this email.</p>
    </div>
  `;

  await resend.emails.send({
    from: "VStore <no-reply@vstore.local>",
    to: opts.to,
    subject,
    html
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]!)
  );
}
