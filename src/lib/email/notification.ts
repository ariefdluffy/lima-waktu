import { randomUUID } from "node:crypto";
import { sendPollEmail } from "./email-service";
import { renderWelcomeHtml } from "./templates/welcome";
import { renderResetPasswordHtml } from "./templates/reset-password";

const BASE_URL = process.env.PUBLIC_APP_URL || "http://localhost:5173";

// ── Send Welcome Email ──
export async function sendWelcomeEmail(props: {
  email: string;
  fullName: string;
}): Promise<void> {
  const loginUrl = `${BASE_URL}/auth/login`;

  const html = renderWelcomeHtml({
    fullName: props.fullName,
    loginUrl,
  });

  const result = await sendPollEmail({
    toEmail: props.email,
    toName: props.fullName,
    subject: "Selamat Datang di Lima Waktu",
    html,
  });

  if (!result.ok) {
    console.error("[email] Gagal kirim welcome ke", props.email, result.error);
  }
}

// ── Send Reset Password Email ──
export async function sendResetPasswordEmail(props: {
  email: string;
  fullName: string;
  token: string;
  expiresInHours?: number;
}): Promise<void> {
  const expiresInHours = props.expiresInHours ?? 1;
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${props.token}`;

  const html = renderResetPasswordHtml({
    fullName: props.fullName,
    resetUrl,
    expiresInHours,
  });

  const result = await sendPollEmail({
    toEmail: props.email,
    toName: props.fullName,
    subject: "Reset Password — Lima Waktu",
    html,
  });

  if (!result.ok) {
    console.error("[email] Gagal kirim reset password ke", props.email, result.error);
  }
}
