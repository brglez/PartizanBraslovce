import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { HALL_NAME, SPORT_LABELS } from "@/lib/config";

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

// Tells every member of a group who wants notifications about a change to
// that group's fixed term (new term set, or term cancelled).
export async function notifyGroupMembers(groupId: string, subject: string, text: string) {
  try {
    const members = await prisma.user.findMany({
      where: { groups: { some: { id: groupId } }, notifyOptIn: true },
      select: { email: true },
    });
    if (members.length === 0) return;
    await sendMail(members.map((m) => m.email), subject, text);
  } catch (err) {
    console.error("notifyGroupMembers failed:", err);
  }
}

// Broadcasts a message to every member who opted in to notifications - used
// when a term frees up and the admin wants to let members know.
export async function notifyOptedInMembers(subject: string, text: string) {
  try {
    const members = await prisma.user.findMany({
      where: { role: "MEMBER", notifyOptIn: true },
      select: { email: true },
    });
    if (members.length === 0) return;
    await sendMail(members.map((m) => m.email), subject, text);
  } catch (err) {
    console.error("notifyOptedInMembers failed:", err);
  }
}

// Tells a guest (no account) whether their reservation request was
// confirmed or rejected.
export async function notifyGuestDecision(
  guestEmail: string,
  guestName: string,
  sport: string,
  startTime: Date,
  endTime: Date,
  decision: "CONFIRMED" | "REJECTED"
) {
  try {
    const when = fmtRange(startTime, endTime);
    const subject =
      decision === "CONFIRMED"
        ? `Rezervacija potrjena – ${when}`
        : `Rezervacija zavrnjena – ${when}`;
    const text =
      decision === "CONFIRMED"
        ? `Pozdravljen(a) ${guestName},\n\nTvoja rezervacija (${SPORT_LABELS[sport] ?? sport}) za ${when} je potrjena.\n\nLep pozdrav,\n${HALL_NAME}`
        : `Pozdravljen(a) ${guestName},\n\nŽal tvoje rezervacije (${SPORT_LABELS[sport] ?? sport}) za ${when} nismo mogli potrditi. Za več informacij nas kontaktiraj.\n\nLep pozdrav,\n${HALL_NAME}`;
    await sendMail(guestEmail, subject, text);
  } catch (err) {
    console.error("notifyGuestDecision failed:", err);
  }
}
