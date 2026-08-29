import { SLOT_MINUTES } from "@/lib/config";

// "CLOSED" is never returned by slotStatusAt itself - it's applied by the
// caller when a whole day is marked closed in the hall's operating hours.
export type SlotStatus = "FREE" | "PENDING" | "CONFIRMED" | "BLOCKED" | "PAST" | "CLOSED";

export interface CalendarBooking {
  id: string;
  sport: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED";
  // Only populated on the admin calendar feed (not the public one) - who
  // the reservation is for, so an admin can tell at a glance.
  bookedBy?: string;
}

export interface CalendarBlockedSlot {
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface DaySlot {
  hour: number;
  minute: number;
}

// Every bookable slot start (e.g. 8:00, 8:30, 9:00, ...) between opening and
// closing time, spaced SLOT_MINUTES apart.
export function slotsOfDay(openingHour: number, closingHour: number): DaySlot[] {
  const slots: DaySlot[] = [];
  for (let m = openingHour * 60; m < closingHour * 60; m += SLOT_MINUTES) {
    slots.push({ hour: Math.floor(m / 60), minute: m % 60 });
  }
  return slots;
}

export function slotStatusAt(
  slotStart: Date,
  slotEnd: Date,
  bookings: CalendarBooking[],
  blockedSlots: CalendarBlockedSlot[]
): { status: SlotStatus; booking?: CalendarBooking; blocked?: CalendarBlockedSlot } {
  if (slotStart.getTime() < Date.now()) {
    return { status: "PAST" };
  }
  const blocked = blockedSlots.find(
    (b) => new Date(b.startTime) < slotEnd && new Date(b.endTime) > slotStart
  );
  if (blocked) return { status: "BLOCKED", blocked };

  const booking = bookings.find(
    (b) => new Date(b.startTime) < slotEnd && new Date(b.endTime) > slotStart
  );
  if (booking) return { status: booking.status, booking };

  return { status: "FREE" };
}
