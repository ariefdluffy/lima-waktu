import { env } from "$env/dynamic/private";
import { sendPollEmail } from "./email-service";
import { renderWelcomeHtml } from "./templates/welcome";
import { renderResetPasswordHtml } from "./templates/reset-password";

const BASE_URL = env.PUBLIC_APP_URL || env.ORIGIN || "http://localhost:5173";
const LOGO_URL = `${BASE_URL}/png/logo-horizontal.png`;

// ── Send Welcome Email ──
export async function sendWelcomeEmail(props: {
  email: string;
  fullName: string;
}): Promise<void> {
  const loginUrl = `${BASE_URL}/auth/login`;

  const html = renderWelcomeHtml({
    fullName: props.fullName,
    loginUrl,
    logoUrl: LOGO_URL,
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
    logoUrl: LOGO_URL,
  });

  const result = await sendPollEmail({
    toEmail: props.email,
    toName: props.fullName,
    subject: "Reset Password — Lima Waktu",
    html,
  });

  if (!result.ok) {
    console.error(
      "[email] Gagal kirim reset password ke",
      props.email,
      result.error,
    );
  }
}
