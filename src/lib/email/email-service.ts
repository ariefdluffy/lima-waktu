import nodemailer from "nodemailer";
import { env } from "$env/dynamic/private";
import type { SendPollEmailInput } from "./types";

export type SendPollEmailResult = {
  ok: boolean;
  status: "sent" | "failed";
  messageId?: string;
  error?: string;
};

function getTransporter() {
  // Env vars: MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_SECURE
  // Fallback: MAILTRAP_API_KEY (nilai token)
  const host = env.MAIL_HOST || "sandbox.smtp.mailtrap.io";
  const port = parseInt(env.MAIL_PORT || "587");
  const user = env.MAIL_USERNAME || "api";
  const pass = env.MAIL_PASSWORD || env.MAILTRAP_API_KEY || "";

  if (!pass) {
    throw new Error(
      "Mail SMTP not configured.\n" +
        "Set MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD di .env.local",
    );
  }

  const secure = env.MAIL_SECURE === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendPollEmail(
  input: SendPollEmailInput,
): Promise<SendPollEmailResult> {
  try {
    const transporter = getTransporter();

    const to = input.toName
      ? `${input.toName} <${input.toEmail}>`
      : input.toEmail;

    const info = await transporter.sendMail({
      from: `Lima Waktu <noreply@limawaktu.my.id>`,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? input.html,
    });

    return {
      ok: true,
      status: "sent",
      messageId: info.messageId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] sendPollEmail error:", message);
    return {
      ok: false,
      status: "failed",
      error: message,
    };
  }
}
