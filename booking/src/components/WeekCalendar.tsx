"use client";

import { useCallback, useMemo, useState } from "react";
import { addDays, addWeeks, startOfWeek, format } from "date-fns";
import { sl } from "date-fns/locale";
import { hoursOfDay, slotStatusAt, type CalendarBooking, type CalendarBlockedSlot } from "@/lib/slots";
import { SPORT_ICONS } from "@/lib/config";
import BookingModal from "./BookingModal";

interface Props {
  isMember: boolean;
  initialWeekStart: string;
  initialBookings: CalendarBooking[];
  initialBlockedSlots: CalendarBlockedSlot[];
}

export default function WeekCalendar({
  isMember,
  initialWeekStart,
  initialBookings,
  initialBlockedSlots,
}: Props) {
  const [weekStart, setWeekStart] = useState(() => new Date(initialWeekStart));
  const [bookings, setBookings] = useState<CalendarBooking[]>(initialBookings);
  const [blockedSlots, setBlockedSlots] = useState<CalendarBlockedSlot[]>(initialBlockedSlots);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const hours = useMemo(() => hoursOfDay(), []);
  const thisWeekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);

  const loadWeek = useCallback(async (start: Date) => {
    setLoading(true);
    const end = addDays(start, 7);
    const res = await fetch(
      `/api/bookings?start=${start.toISOString()}&end=${end.toISOString()}`
    );
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings);
      setBlockedSlots(data.blockedSlots);
    }
    setLoading(false);
  }, []);

  function goToWeek(delta: number) {
    const next = addWeeks(weekStart, delta);
    setWeekStart(next);
    loadWeek(next);
  }

  function handleSlotClick(day: Date, hour: number) {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 1, 0, 0, 0);
    setSelectedSlot({ start, end });
  }

  function handleBooked() {
    loadWeek(weekStart);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToWeek(-1)}
            disabled={weekStart.getTime() <= thisWeekStart.getTime()}
            className="rounded-full border border-border w-9 h-9 flex items-center justify-center text-ink-dim hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Prejšnji teden"
          >
            ←
          </button>
          <p className="font-head font-bold text-lg min-w-[220px] text-center">
            {format(weekStart, "d. MMM", { locale: sl })} –{" "}
            {format(addDays(weekStart, 6), "d. MMM yyyy", { locale: sl })}
          </p>
          <button
            onClick={() => goToWeek(1)}
            className="rounded-full border border-border w-9 h-9 flex items-center justify-center text-ink-dim hover:bg-gray-100"
            aria-label="Naslednji teden"
          >
            →
          </button>
        </div>
        <Legend />
      </div>

      <div className={`overflow-x-auto rounded-2xl border border-border bg-white shadow-sm ${loading ? "opacity-50" : ""}`}>
        <table className="w-full border-collapse min-w-[720px]">
          <thead>
            <tr>
              <th className="w-16 border-b border-border p-2 text-xs font-semibold text-ink-dim"></th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className="border-b border-l border-border p-2 text-center"
                >
                  <div className="text-xs uppercase tracking-wide text-ink-dim">
                    {format(day, "EEE", { locale: sl })}
                  </div>
                  <div className="font-head font-bold">{format(day, "d.M.")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td className="w-16 border-b border-border p-2 text-xs text-ink-dim text-right pr-3">
                  {hour}:00
                </td>
                {days.map((day) => {
                  const slotStart = new Date(day);
                  slotStart.setHours(hour, 0, 0, 0);
                  const slotEnd = new Date(day);
                  slotEnd.setHours(hour + 1, 0, 0, 0);
                  const { status, booking, blocked } = slotStatusAt(
                    slotStart,
                    slotEnd,
                    bookings,
                    blockedSlots
                  );

                  return (
                    <td
                      key={day.toISOString() + hour}
                      className="border-b border-l border-border p-1 h-12 text-center align-middle"
                    >
                      <SlotCell
                        status={status}
                        sport={booking?.sport}
                        reason={blocked?.reason}
                        onClick={
                          status === "FREE" ? () => handleSlotClick(day, hour) : undefined
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSlot && (
        <BookingModal
          startTime={selectedSlot.start}
          endTime={selectedSlot.end}
          isMember={isMember}
          onClose={() => setSelectedSlot(null)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}

function SlotCell({
  status,
  sport,
  reason,
  onClick,
}: {
  status: string;
  sport?: string;
  reason?: string;
  onClick?: () => void;
}) {
  if (status === "PAST") {
    return <div className="w-full h-full rounded-lg bg-gray-50" />;
  }
  if (status === "FREE") {
    return (
      <button
        onClick={onClick}
        className="w-full h-full rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-100 transition-colors text-teal-700 text-xs font-semibold"
        title="Prosto - klikni za rezervacijo"
      >
        Prosto
      </button>
    );
  }
  if (status === "CONFIRMED") {
    return (
      <div
        className="w-full h-full rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-base"
        title="Zasedeno"
      >
        {sport ? SPORT_ICONS[sport] : "🔒"}
      </div>
    );
  }
  if (status === "PENDING") {
    return (
      <div
        className="w-full h-full rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-xs font-semibold text-amber-700"
        title="Čaka na potrditev"
      >
        V obravnavi
      </div>
    );
  }
  return (
    <div
      className="w-full h-full rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-ink-dim"
      title={reason ?? "Blokirano"}
    >
      Zaprto
    </div>
  );
}

function Legend() {
  const items: [string, string][] = [
    ["bg-teal-50 border-teal-200", "Prosto"],
    ["bg-accent/15 border-accent/30", "Zasedeno"],
    ["bg-amber-50 border-amber-200", "V obravnavi"],
    ["bg-gray-100 border-gray-200", "Zaprto"],
  ];
  return (
    <div className="flex items-center gap-3 text-xs text-ink-dim flex-wrap">
      {items.map(([cls, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`inline-block w-3 h-3 rounded border ${cls}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
