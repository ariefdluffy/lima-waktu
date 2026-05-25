import nodemailer from "nodemailer";
import type { SendPollEmailInput } from "./types";

export type SendPollEmailResult = {
  ok: boolean;
  status: "sent" | "failed";
  messageId?: string;
  error?: string;
};

// Get SMTP client configuration
//
// Supports two Mailtrap credential formats:
//   1. NEW Mailtrap (unified platform): username="api" + API token
//      MAILTRAP_API_TOKEN=xxx
//      Host: sandbox.smtp.mailtrap.io (test) | live.smtp.mailtrap.io (prod)
//
//   2. OLD Mailtrap (legacy sandbox):    API key + API secret
//      MAILTRAP_API_KEY=xxx   MAILTRAP_SECRET=xxx
//      Host: smtp.mailtrap.io
//
function getTransporter() {
  const isNewFormat = !!process.env.MAILTRAP_API_TOKEN;
  const isOldFormat =
    !!process.env.MAILTRAP_API_KEY && !!process.env.MAILTRAP_SECRET;

  if (!isNewFormat && !isOldFormat) {
    throw new Error(
      "Mailtrap SMTP not configured. Set either:\n" +
        "  - MAILTRAP_API_TOKEN  (new Mailtrap format)\n" +
        "  - MAILTRAP_API_KEY + MAILTRAP_SECRET  (old Mailtrap format)",
    );
  }

  const transporter = nodemailer.createTransport({
    host:
      process.env.MAILTRAP_SMTP_HOST ||
      (isNewFormat ? "sandbox.smtp.mailtrap.io" : "smtp.mailtrap.io"),
    port: parseInt(process.env.MAILTRAP_SMTP_PORT || "587"),
    secure: process.env.MAILTRAP_SMTP_SECURE === "true",
    auth: {
      user: isNewFormat ? "api" : process.env.MAILTRAP_API_KEY!,
      pass: isNewFormat
        ? process.env.MAILTRAP_API_TOKEN!
        : process.env.MAILTRAP_SECRET!,
    },
  });

  return transporter;
}

export async function sendPollEmail(
  input: SendPollEmailInput,
): Promise<SendPollEmailResult> {
  const transporter = getTransporter();

  const to = input.toName
    ? `${input.toName} <${input.toEmail}>`
    : input.toEmail;

  try {
    const info = await transporter.sendMail({
      from: `Lima Waktu <noreply@lima-waktu.dev>`,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? input.html,
    });

    if (info.messageId) {
      return {
        ok: true,
        status: "sent",
        messageId: info.messageId,
      };
    }

    return {
      ok: true,
      status: "sent",
      messageId: undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      ok: false,
      status: "failed",
      error: message,
    };
  }
}
