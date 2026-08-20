import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  bookingInputSchema,
  createBooking,
  BookingOverlapError,
  BookingValidationError,
} from "@/lib/bookings";

const rangeSchema = z.object({
  start: z.iso.datetime(),
  end: z.iso.datetime(),
});

export async function GET(request: NextRequest) {
  const parsed = rangeSchema.safeParse({
    start: request.nextUrl.searchParams.get("start"),
    end: request.nextUrl.searchParams.get("end"),
  });
  if (!parsed.success) {
    return Response.json({ error: "Neveljaven časovni razpon." }, { status: 400 });
  }
  const start = new Date(parsed.data.start);
  const end = new Date(parsed.data.end);

  const [bookings, blockedSlots] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: {
        id: true,
        sport: true,
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedSlot.findMany({
      where: {
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: { id: true, startTime: true, endTime: true, reason: true },
    }),
  ]);

  return Response.json({ bookings, blockedSlots });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const body = await request.json().catch(() => null);
  const parsed = bookingInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Neveljavni podatki." },
      { status: 400 }
    );
  }

  const actor = session?.user
    ? { id: session.user.id, role: session.user.role }
    : null;

  try {
    const booking = await createBooking(parsed.data, actor);
    return Response.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingOverlapError) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof BookingValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: "Rezervacije trenutno ni mogoče ustvariti." }, { status: 500 });
  }
}
