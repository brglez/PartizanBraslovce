import { prisma } from "@/lib/prisma";
import { SLOT_MINUTES } from "@/lib/config";
import { getHallHours } from "@/lib/settings";
import { z } from "zod";

export const bookingInputSchema = z
  .object({
    sport: z.enum(["BADMINTON", "ODBOJKA", "KOSARKA", "DRUGO"]),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    guestName: z.string().trim().min(2).max(120).optional(),
    guestEmail: z.email().optional(),
    guestPhone: z.string().trim().min(5).max(30).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "Čas konca mora biti za časom začetka.",
  });

export class BookingValidationError extends Error {}
export class BookingOverlapError extends Error {}

function isAlignedToSlot(date: Date) {
  return (
    date.getUTCMinutes() % SLOT_MINUTES === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

export async function assertWithinOperatingHours(startTime: Date, endTime: Date) {
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
  if (durationMinutes <= 0 || durationMinutes % SLOT_MINUTES !== 0) {
    throw new BookingValidationError(`Termin mora trajati v korakih po ${SLOT_MINUTES} minut.`);
  }
  if (!isAlignedToSlot(startTime) || !isAlignedToSlot(endTime)) {
    throw new BookingValidationError("Termin se mora začeti ob pravem terminu.");
  }
  if (startTime.getTime() < Date.now()) {
    throw new BookingValidationError("Ni mogoče rezervirati termina v preteklosti.");
  }
  const { openingHour, closingHour, closedWeekdays } = await getHallHours();
  if (closedWeekdays.includes(startTime.getDay())) {
    throw new BookingValidationError("Ob tem dnevu je telovadnica zaprta.");
  }
  // Local-time minute-of-day check based on the configured hall hours.
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutesRaw = endTime.getHours() * 60 + endTime.getMinutes();
  const endMinutes = endMinutesRaw === 0 ? 24 * 60 : endMinutesRaw;
  if (startMinutes < openingHour * 60 || endMinutes > closingHour * 60) {
    throw new BookingValidationError(
      `Termini so mogoči med ${openingHour}:00 in ${closingHour}:00.`
    );
  }
}

// Admin-blocked periods aren't member/guest bookings - they don't need to
// align to a whole-hour slot (e.g. "četrtek 20:30-22:00" is a valid block),
// they just need a sane, positive duration.
export function assertValidBlockedSlot(startTime: Date, endTime: Date) {
  if (endTime.getTime() <= startTime.getTime()) {
    throw new BookingValidationError("Čas konca mora biti za časom začetka.");
  }
}

export async function findConflicts(startTime: Date, endTime: Date, excludeBookingId?: string) {
  const [bookings, blockedSlots] = await Promise.all([
    prisma.booking.findMany({
      where: {
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    }),
    prisma.blockedSlot.findMany({
      where: {
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    }),
  ]);
  return { bookings, blockedSlots };
}

type CreateBookingInput = z.infer<typeof bookingInputSchema>;

export async function createBooking(
  input: CreateBookingInput,
  actor: { id: string; role: "MEMBER" | "ADMIN" } | null
) {
  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);
  await assertWithinOperatingHours(startTime, endTime);

  const isMember = actor !== null;
  if (!isMember) {
    if (!input.guestName || !input.guestEmail || !input.guestPhone) {
      throw new BookingValidationError(
        "Za rezervacijo brez prijave so ime, e-pošta in telefon obvezni."
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const conflicts = await tx.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (conflicts.length > 0) {
      throw new BookingOverlapError("Ta termin je že zaseden ali čaka na potrditev.");
    }
    const blocked = await tx.blockedSlot.findMany({
      where: {
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (blocked.length > 0) {
      throw new BookingOverlapError("Ta termin ni na voljo (blokiran s strani upravitelja).");
    }

    return tx.booking.create({
      data: {
        sport: input.sport,
        startTime,
        endTime,
        notes: input.notes,
        status: isMember ? "CONFIRMED" : "PENDING",
        userId: isMember ? actor!.id : undefined,
        guestName: isMember ? undefined : input.guestName,
        guestEmail: isMember ? undefined : input.guestEmail,
        guestPhone: isMember ? undefined : input.guestPhone,
      },
    });
  });
}
