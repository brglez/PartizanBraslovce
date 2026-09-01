"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertValidBlockedSlot } from "@/lib/bookings";
import { updateHallHours } from "@/lib/settings";
import {
  notifyAdmins,
  notifyGuestDecision,
  notifyGroupMembers,
  notifyOptedInMembers,
  fmtRange,
} from "@/lib/notify";
import { HALL_NAME } from "@/lib/config";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Nimate dovoljenja za to dejanje.");
  }
  return session;
}

export async function approveBooking(bookingId: string) {
  const session = await requireAdmin();
  const booking = await prisma.booking.update({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  await notifyAdmins(
    "Rezervacija potrjena",
    `${session.user.name} je potrdil(a) rezervacijo (${booking.guestName ?? "gost"}) za ${fmtRange(booking.startTime, booking.endTime)}.`
  );
  if (booking.guestEmail) {
    await notifyGuestDecision(
      booking.guestEmail,
      booking.guestName ?? "gost",
      booking.sport,
      booking.startTime,
      booking.endTime,
      "CONFIRMED"
    );
  }
}

export async function rejectBooking(bookingId: string) {
  const session = await requireAdmin();
  const booking = await prisma.booking.update({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  await notifyAdmins(
    "Rezervacija zavrnjena",
    `${session.user.name} je zavrnil(a) rezervacijo (${booking.guestName ?? "gost"}) za ${fmtRange(booking.startTime, booking.endTime)}.`
  );
  if (booking.guestEmail) {
    await notifyGuestDecision(
      booking.guestEmail,
      booking.guestName ?? "gost",
      booking.sport,
      booking.startTime,
      booking.endTime,
      "REJECTED"
    );
  }
}

export async function cancelBooking(bookingId: string) {
  const session = await requireAdmin();
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  await notifyAdmins(
    "Rezervacija preklicana",
    `${session.user.name} je preklical(a) rezervacijo za ${fmtRange(booking.startTime, booking.endTime)}.`
  );
}

const sportEnum = z.enum([
  "BADMINTON",
  "ODBOJKA",
  "KOSARKA",
  "REKREACIJA_SKUPINE",
  "SEDECA_ODBOJKA",
  "DRUGO",
]);

const blockedSlotSchema = z
  .object({
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    reason: z.string().trim().min(2).max(200),
    sport: sportEnum.optional(),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "Čas konca mora biti za časom začetka.",
  });

export type BlockSlotState = { error?: string } | undefined;

export async function createBlockedSlot(
  _prev: BlockSlotState,
  formData: FormData
): Promise<BlockSlotState> {
  const session = await requireAdmin();
  const parsed = blockedSlotSchema.safeParse({
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason"),
    sport: formData.get("sport") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neveljavni podatki." };
  }
  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);
  try {
    assertValidBlockedSlot(startTime, endTime);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Neveljaven termin." };
  }

  await prisma.blockedSlot.create({
    data: { startTime, endTime, reason: parsed.data.reason, sport: parsed.data.sport },
  });
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  await notifyAdmins(
    "Koledar: nov blokiran termin",
    `${session.user.name} je blokiral(a) termin ${fmtRange(startTime, endTime)} - ${parsed.data.reason}.`
  );
  return undefined;
}

export async function deleteBlockedSlot(id: string) {
  const session = await requireAdmin();
  const removed = await prisma.blockedSlot.delete({ where: { id } });
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  await notifyAdmins(
    "Koledar: blokada odstranjena",
    `${session.user.name} je odstranil(a) blokado ${fmtRange(removed.startTime, removed.endTime)} - ${removed.reason}.`
  );
}

const recurringOccurrenceSchema = z
  .object({
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "Čas konca mora biti za časom začetka.",
  });

const recurringBlockSchema = z.object({
  occurrences: z
    .array(recurringOccurrenceSchema)
    .min(1, "Izbrano obdobje ne vsebuje nobenega termina.")
    .max(200, "Preveč terminov naenkrat (največ 200) - skrajšaj obdobje sezone."),
  reason: z.string().trim().min(2).max(200),
  sport: sportEnum.optional(),
  groupId: z.string().trim().min(1).optional(),
});

export type RecurringBlockState = { error?: string } | undefined;

export async function createRecurringBlockedSlot(
  _prev: RecurringBlockState,
  formData: FormData
): Promise<RecurringBlockState> {
  const session = await requireAdmin();

  let occurrences: unknown;
  try {
    occurrences = JSON.parse(String(formData.get("occurrences") || "[]"));
  } catch {
    return { error: "Neveljavni podatki o terminih." };
  }

  const parsed = recurringBlockSchema.safeParse({
    occurrences,
    reason: formData.get("reason"),
    sport: formData.get("sport") || undefined,
    groupId: formData.get("groupId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neveljavni podatki." };
  }

  for (const occ of parsed.data.occurrences) {
    try {
      assertValidBlockedSlot(new Date(occ.startTime), new Date(occ.endTime));
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Neveljaven termin v seriji." };
    }
  }

  const seriesId = crypto.randomUUID();
  await prisma.blockedSlot.createMany({
    data: parsed.data.occurrences.map((occ) => ({
      startTime: new Date(occ.startTime),
      endTime: new Date(occ.endTime),
      reason: parsed.data.reason,
      sport: parsed.data.sport,
      groupId: parsed.data.groupId,
      seriesId,
    })),
  });
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  const first = parsed.data.occurrences[0];
  await notifyAdmins(
    "Koledar: nova ponavljajoča blokada",
    `${session.user.name} je dodal(a) ponavljajočo blokado (${parsed.data.occurrences.length} terminov, prvi ${fmtRange(new Date(first.startTime), new Date(first.endTime))}) - ${parsed.data.reason}.`
  );
  if (parsed.data.groupId) {
    const group = await prisma.group.findUnique({ where: { id: parsed.data.groupId } });
    if (group) {
      await notifyGroupMembers(
        group.id,
        `Nov redni termin – ${group.name}`,
        `Pozdravljeni,\n\nza skupino ${group.name} je bil dodan redni tedenski termin, prvi ${fmtRange(new Date(first.startTime), new Date(first.endTime))} (skupaj ${parsed.data.occurrences.length} terminov).\n\nLep pozdrav,\n${HALL_NAME}`
      );
    }
  }
  return undefined;
}

export async function deleteBlockedSlotSeries(seriesId: string) {
  const session = await requireAdmin();
  const occurrences = await prisma.blockedSlot.findMany({ where: { seriesId } });
  const removed = await prisma.blockedSlot.deleteMany({ where: { seriesId } });
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  await notifyAdmins(
    "Koledar: ponavljajoča blokada odstranjena",
    `${session.user.name} je odstranil(a) ponavljajočo blokado (${removed.count} terminov).`
  );
  const groupId = occurrences.find((o) => o.groupId)?.groupId;
  if (groupId) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (group) {
      await notifyGroupMembers(
        group.id,
        `Redni termin odpovedan – ${group.name}`,
        `Pozdravljeni,\n\nredni tedenski termin za skupino ${group.name} je bil odpovedan.\n\nLep pozdrav,\n${HALL_NAME}`
      );
    }
  }
}

const memberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8).max(72),
  role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
});

export type AddMemberState = { error?: string } | undefined;

export async function addMember(
  _prev: AddMemberState,
  formData: FormData
): Promise<AddMemberState> {
  await requireAdmin();
  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    role: formData.get("role") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neveljavni podatki." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Uporabnik s tem e-poštnim naslovom že obstaja." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
      role: parsed.data.role,
    },
  });
  revalidatePath("/admin/clani");
  return undefined;
}

export async function removeMember(userId: string) {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    throw new Error("Ne morete izbrisati lastnega računa.");
  }
  await prisma.user.delete({ where: { id: userId, role: "MEMBER" } });
  revalidatePath("/admin/clani");
}

export type GroupState = { error?: string } | undefined;

export async function createGroup(_prev: GroupState, formData: FormData): Promise<GroupState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) {
    return { error: "Ime skupine mora imeti vsaj 2 znaka." };
  }
  const existing = await prisma.group.findUnique({ where: { name } });
  if (existing) {
    return { error: "Skupina s tem imenom že obstaja." };
  }
  await prisma.group.create({ data: { name } });
  revalidatePath("/admin/clani");
  revalidatePath("/admin/koledar");
  return undefined;
}

export async function deleteGroup(groupId: string) {
  await requireAdmin();
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath("/admin/clani");
  revalidatePath("/admin/koledar");
}

// Sets exactly which groups a member belongs to and whether they want
// notification e-mails - submitted together from one row on /admin/clani.
export async function updateMemberSettings(userId: string, formData: FormData) {
  await requireAdmin();
  const groupIds = formData.getAll("groupIds").map(String);
  const notifyOptIn = formData.get("notifyOptIn") === "on";
  await prisma.user.update({
    where: { id: userId, role: "MEMBER" },
    data: {
      notifyOptIn,
      groups: { set: groupIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/admin/clani");
}

const notifyFreedSlotSchema = z
  .object({
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    message: z.string().trim().max(500).optional(),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "Čas konca mora biti za časom začetka.",
  });

export type NotifyFreedSlotState = { error?: string; sent?: boolean } | undefined;

// Lets an admin broadcast to every opted-in member that a specific term
// just freed up, with an optional note and a link to go book it.
export async function notifyFreedSlot(
  _prev: NotifyFreedSlotState,
  formData: FormData
): Promise<NotifyFreedSlotState> {
  await requireAdmin();
  const parsed = notifyFreedSlotSchema.safeParse({
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neveljavni podatki." };
  }
  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);
  const when = fmtRange(startTime, endTime);
  const link = process.env.NEXTAUTH_URL || "https://rezervacije.partizan-braslovce.si/";
  const text = [
    `Pozdravljeni,`,
    ``,
    `sprostil se je termin: ${when}.`,
    parsed.data.message ? `\n${parsed.data.message}\n` : "",
    `Če te zanima, ga rezerviraj tukaj: ${link}`,
    ``,
    `Lep pozdrav,`,
    HALL_NAME,
  ].join("\n");
  await notifyOptedInMembers(`Sprostil se je termin – ${when}`, text);
  return { sent: true };
}

const hallHoursSchema = z
  .object({
    openingHour: z.coerce.number().int().min(0).max(23),
    closingHour: z.coerce.number().int().min(1).max(24),
    closedWeekdays: z.array(z.coerce.number().int().min(0).max(6)),
  })
  .refine((v) => v.closingHour > v.openingHour, {
    message: "Ura zaprtja mora biti za uro odprtja.",
  });

export type HallHoursState = { error?: string } | undefined;

const WEEKDAY_NAMES = ["Ned", "Pon", "Tor", "Sre", "Čet", "Pet", "Sob"];

export async function updateHallHoursAction(
  _prev: HallHoursState,
  formData: FormData
): Promise<HallHoursState> {
  const session = await requireAdmin();
  const parsed = hallHoursSchema.safeParse({
    openingHour: formData.get("openingHour"),
    closingHour: formData.get("closingHour"),
    closedWeekdays: formData.getAll("closedWeekdays"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neveljavni podatki." };
  }
  await updateHallHours(parsed.data.openingHour, parsed.data.closingHour, parsed.data.closedWeekdays);
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  const closedLabel = parsed.data.closedWeekdays.length
    ? parsed.data.closedWeekdays.map((d) => WEEKDAY_NAMES[d]).join(", ")
    : "brez";
  await notifyAdmins(
    "Koledar: spremenjen čas obratovanja",
    `${session.user.name} je nastavil(a) čas obratovanja na ${parsed.data.openingHour}:00–${parsed.data.closingHour}:00. Zaprti dnevi: ${closedLabel}.`
  );
  return undefined;
}
