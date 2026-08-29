"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertValidBlockedSlot } from "@/lib/bookings";
import { updateHallHours } from "@/lib/settings";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Nimate dovoljenja za to dejanje.");
  }
  return session;
}

export async function approveBooking(bookingId: string) {
  await requireAdmin();
  await prisma.booking.update({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/koledar");
  revalidatePath("/");
}

export async function rejectBooking(bookingId: string) {
  await requireAdmin();
  await prisma.booking.update({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/koledar");
  revalidatePath("/");
}

export async function cancelBooking(bookingId: string) {
  await requireAdmin();
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/koledar");
  revalidatePath("/");
}

const blockedSlotSchema = z
  .object({
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    reason: z.string().trim().min(2).max(200),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "Čas konca mora biti za časom začetka.",
  });

export type BlockSlotState = { error?: string } | undefined;

export async function createBlockedSlot(
  _prev: BlockSlotState,
  formData: FormData
): Promise<BlockSlotState> {
  await requireAdmin();
  const parsed = blockedSlotSchema.safeParse({
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason"),
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
    data: { startTime, endTime, reason: parsed.data.reason },
  });
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  return undefined;
}

export async function deleteBlockedSlot(id: string) {
  await requireAdmin();
  await prisma.blockedSlot.delete({ where: { id } });
  revalidatePath("/admin/koledar");
  revalidatePath("/");
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
});

export type RecurringBlockState = { error?: string } | undefined;

export async function createRecurringBlockedSlot(
  _prev: RecurringBlockState,
  formData: FormData
): Promise<RecurringBlockState> {
  await requireAdmin();

  let occurrences: unknown;
  try {
    occurrences = JSON.parse(String(formData.get("occurrences") || "[]"));
  } catch {
    return { error: "Neveljavni podatki o terminih." };
  }

  const parsed = recurringBlockSchema.safeParse({ occurrences, reason: formData.get("reason") });
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
      seriesId,
    })),
  });
  revalidatePath("/admin/koledar");
  revalidatePath("/");
  return undefined;
}

export async function deleteBlockedSlotSeries(seriesId: string) {
  await requireAdmin();
  await prisma.blockedSlot.deleteMany({ where: { seriesId } });
  revalidatePath("/admin/koledar");
  revalidatePath("/");
}

const memberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8).max(72),
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
      role: "MEMBER",
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

export async function updateHallHoursAction(
  _prev: HallHoursState,
  formData: FormData
): Promise<HallHoursState> {
  await requireAdmin();
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
  return undefined;
}
