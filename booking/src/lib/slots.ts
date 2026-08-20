import { OPENING_HOUR, CLOSING_HOUR } from "@/lib/config";

export type SlotStatus = "FREE" | "PENDING" | "CONFIRMED" | "BLOCKED" | "PAST";

export interface CalendarBooking {
  id: string;
  sport: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED";
}

export interface CalendarBlockedSlot {
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export function hoursOfDay(): number[] {
  const hours: number[] = [];
  for (let h = OPENING_HOUR; h < CLOSING_HOUR; h++) hours.push(h);
  return hours;
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
