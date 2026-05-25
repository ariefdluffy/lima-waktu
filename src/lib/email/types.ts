export interface SendPollEmailInput {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  priority?: "High" | "Normal" | "Low";
}
