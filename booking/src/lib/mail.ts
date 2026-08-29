import nodemailer from "nodemailer";
import { HALL_NAME } from "@/lib/config";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: Number(process.env.SMTP_PORT ?? 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Never throws - a failed/unconfigured notification email must not break
// the booking/admin action that triggered it.
export async function sendMail(to: string | string[], subject: string, text: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("sendMail: SMTP ni konfiguriran, e-pošta ni poslana.");
    return;
  }
  try {
    await getTransporter().sendMail({
      from: `"${HALL_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("sendMail failed:", err);
  }
}
