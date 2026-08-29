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

// Who's on the calendar (and whether guest names are included) depends on
// the caller's session - never cache this response.
export const dynamic = "force-dynamic";

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

  // Only admins get to see who a reservation is for - keep it anonymous on
  // the public feed.
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [bookingRows, blockedSlots] = await Promise.all([
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
        guestName: isAdmin,
        user: isAdmin ? { select: { name: true } } : false,
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

  const bookings = bookingRows.map((b) => {
    const withNames = b as typeof b & { guestName?: string | null; user?: { name: string } | null };
    return {
      id: b.id,
      sport: b.sport,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      bookedBy: isAdmin
        ? withNames.user
          ? `${withNames.user.name} (član)`
          : `${withNames.guestName} (gost)`
        : undefined,
    };
  });

  return Response.json(
    { bookings, blockedSlots },
    { headers: { "Cache-Control": "no-store" } }
  );
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
