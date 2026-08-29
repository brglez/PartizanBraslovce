import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export function fmtRange(startTime: Date, endTime: Date) {
  const date = startTime.toLocaleString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const start = startTime.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" });
  const end = endTime.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${start}–${end}`;
}

// Notifies every ADMIN user by email. Used for new reservations,
// confirmations and calendar changes so every admin stays in sync.
export async function notifyAdmins(subject: string, text: string) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    if (admins.length === 0) return;
    await sendMail(
      admins.map((a) => a.email),
      subject,
      text
    );
  } catch (err) {
    console.error("notifyAdmins failed:", err);
  }
}
