"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertWithinOperatingHours } from "@/lib/bookings";

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
    assertWithinOperatingHours(startTime, endTime);
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
