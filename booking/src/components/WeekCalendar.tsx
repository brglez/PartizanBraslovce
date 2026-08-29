"use client";

import { useCallback, useMemo, useState } from "react";
import { addDays, addWeeks, startOfWeek, format } from "date-fns";
import { sl } from "date-fns/locale";
import { slotsOfDay, slotStatusAt, type CalendarBooking, type CalendarBlockedSlot } from "@/lib/slots";
import { SPORT_ICONS, SLOT_MINUTES } from "@/lib/config";
import BookingModal from "./BookingModal";

interface Props {
  isMember: boolean;
  openingHour: number;
  closingHour: number;
  closedWeekdays: number[];
  initialWeekStart: string;
  initialBookings: CalendarBooking[];
  initialBlockedSlots: CalendarBlockedSlot[];
  // Admin overview: no click-to-select/booking, just a read-only view of
  // the week with block reasons visible.
  readOnly?: boolean;
}

interface Selection {
  day: Date;
  startMinutes: number;
  endMinutes: number;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function fmtHM(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

export default function WeekCalendar({
  isMember,
  openingHour,
  closingHour,
  closedWeekdays,
  initialWeekStart,
  initialBookings,
  initialBlockedSlots,
  readOnly = false,
}: Props) {
  const [weekStart, setWeekStart] = useState(() => new Date(initialWeekStart));
  const [bookings, setBookings] = useState<CalendarBooking[]>(initialBookings);
  const [blockedSlots, setBlockedSlots] = useState<CalendarBlockedSlot[]>(initialBlockedSlots);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showModal, setShowModal] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const slots = useMemo(() => slotsOfDay(openingHour, closingHour), [openingHour, closingHour]);
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
    setSelection(null);
    loadWeek(next);
  }

  function handleSlotClick(day: Date, hour: number, minute: number) {
    if (readOnly) return;
    const t = hour * 60 + minute;

    if (!selection || !sameDay(selection.day, day)) {
      setSelection({ day, startMinutes: t, endMinutes: t + SLOT_MINUTES });
      return;
    }

    // Extend backwards/forwards if the click is right next to the current range.
    if (t === selection.startMinutes - SLOT_MINUTES) {
      setSelection({ ...selection, startMinutes: t });
      return;
    }
    if (t === selection.endMinutes) {
      setSelection({ ...selection, endMinutes: t + SLOT_MINUTES });
      return;
    }

    // Clicking inside the current range shrinks it from whichever edge was clicked.
    if (t >= selection.startMinutes && t < selection.endMinutes) {
      const isMultiSlot = selection.endMinutes - selection.startMinutes > SLOT_MINUTES;
      if (t === selection.startMinutes) {
        setSelection(isMultiSlot ? { ...selection, startMinutes: t + SLOT_MINUTES } : null);
        return;
      }
      if (t === selection.endMinutes - SLOT_MINUTES) {
        setSelection(isMultiSlot ? { ...selection, endMinutes: t } : null);
        return;
      }
      // Clicked a slot in the middle of the range - start a fresh selection there.
      setSelection({ day, startMinutes: t, endMinutes: t + SLOT_MINUTES });
      return;
    }

    // Non-adjacent slot - start a new selection.
    setSelection({ day, startMinutes: t, endMinutes: t + SLOT_MINUTES });
  }

  function isSelected(day: Date, hour: number, minute: number) {
    if (!selection || !sameDay(selection.day, day)) return false;
    const t = hour * 60 + minute;
    return t >= selection.startMinutes && t < selection.endMinutes;
  }

  function handleBooked() {
    setSelection(null);
    setShowModal(false);
    loadWeek(weekStart);
  }

  const selectionDuration = selection ? selection.endMinutes - selection.startMinutes : 0;
  const canReserve = selectionDuration >= 60;

  const selectionStartDate = useMemo(() => {
    if (!selection) return null;
    const d = new Date(selection.day);
    d.setHours(Math.floor(selection.startMinutes / 60), selection.startMinutes % 60, 0, 0);
    return d;
  }, [selection]);
  const selectionEndDate = useMemo(() => {
    if (!selection) return null;
    const d = new Date(selection.day);
    d.setHours(Math.floor(selection.endMinutes / 60), selection.endMinutes % 60, 0, 0);
    return d;
  }, [selection]);

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
              <th className="w-16 border-b border-border p-1 text-xs font-semibold text-ink-dim"></th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className="border-b border-l border-border p-1.5 text-center"
                >
                  <div className="text-xs uppercase tracking-wide text-ink-dim">
                    {format(day, "EEE", { locale: sl })}
                  </div>
                  <div className="font-head font-bold text-sm">{format(day, "d.M.")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map(({ hour, minute }) => (
              <tr key={`${hour}:${minute}`}>
                <td className="w-16 border-b border-border px-2 py-0.5 text-[11px] text-ink-dim text-right">
                  {hour}:{minute.toString().padStart(2, "0")}
                </td>
                {days.map((day) => {
                  const slotStart = new Date(day);
                  slotStart.setHours(hour, minute, 0, 0);
                  const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60000);
                  let { status, booking, blocked } = slotStatusAt(
                    slotStart,
                    slotEnd,
                    bookings,
                    blockedSlots
                  );
                  if (status === "FREE" && closedWeekdays.includes(day.getDay())) {
                    status = "CLOSED";
                  }
                  const selected = status === "FREE" && isSelected(day, hour, minute);

                  return (
                    <td
                      key={day.toISOString() + hour + ":" + minute}
                      className="border-b border-l border-border p-0.5 h-7 text-center align-middle"
                    >
                      <SlotCell
                        status={status}
                        selected={selected}
                        sport={booking?.sport}
                        reason={blocked?.reason}
                        readOnly={readOnly}
                        onClick={
                          status === "FREE" && !readOnly
                            ? () => handleSlotClick(day, hour, minute)
                            : undefined
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

      {selection && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy px-5 py-3.5 text-white shadow-2xl">
          <p className="text-sm">
            Izbrano: <strong className="capitalize">{format(selection.day, "EEEE d.M.", { locale: sl })}</strong>{" "}
            {fmtHM(selection.startMinutes)}–{fmtHM(selection.endMinutes)}
            {" "}
            <span className="text-white/70">
              ({(selectionDuration / 60).toLocaleString("sl-SI")} h)
            </span>
            {!canReserve && (
              <span className="block text-xs text-amber-300">Izberi vsaj eno uro (2 zaporedna termina).</span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSelection(null)}
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Počisti
            </button>
            <button
              onClick={() => setShowModal(true)}
              disabled={!canReserve}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:hover:bg-accent"
            >
              Rezerviraj
            </button>
          </div>
        </div>
      )}

      {showModal && selectionStartDate && selectionEndDate && (
        <BookingModal
          startTime={selectionStartDate}
          endTime={selectionEndDate}
          isMember={isMember}
          onClose={() => setShowModal(false)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}

function SlotCell({
  status,
  selected,
  sport,
  reason,
  readOnly,
  onClick,
}: {
  status: string;
  selected?: boolean;
  sport?: string;
  reason?: string;
  readOnly?: boolean;
  onClick?: () => void;
}) {
  if (status === "PAST") {
    return <div className="w-full h-full rounded bg-gray-50" />;
  }
  if (status === "CLOSED") {
    return <div className="w-full h-full rounded bg-gray-50" title="Zaprto" />;
  }
  if (status === "FREE") {
    if (readOnly) {
      return <div className="w-full h-full rounded bg-teal-50 border border-teal-100" title="Prosto" />;
    }
    return (
      <button
        onClick={onClick}
        className={`w-full h-full rounded transition-colors text-[10px] font-semibold ${
          selected
            ? "bg-accent border border-accent-dark text-white"
            : "bg-teal-50 hover:bg-teal-100 border border-teal-100 text-teal-700"
        }`}
        title={selected ? "Izbrano - klikni za odizbiro" : "Prosto - klikni za izbiro"}
      />
    );
  }
  if (status === "CONFIRMED") {
    return (
      <div
        className="w-full h-full rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-sm"
        title="Zasedeno"
      >
        {sport ? SPORT_ICONS[sport] : "🔒"}
      </div>
    );
  }
  if (status === "PENDING") {
    return (
      <div
        className="w-full h-full rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-[10px] font-semibold text-amber-700"
        title="Čaka na potrditev"
      >
        V obravnavi
      </div>
    );
  }
  return (
    <div
      className="w-full h-full rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden px-0.5 text-center text-[9px] leading-tight text-ink-dim"
      title={reason ?? "Zasedeno"}
    >
      <span className="line-clamp-2">{reason ?? "Zasedeno"}</span>
    </div>
  );
}

function Legend() {
  const items: [string, string][] = [
    ["bg-teal-50 border-teal-200", "Prosto"],
    ["bg-accent border-accent-dark", "Izbrano"],
    ["bg-accent/15 border-accent/30", "Zasedeno"],
    ["bg-amber-50 border-amber-200", "V obravnavi"],
    ["bg-gray-100 border-gray-200", "Zasedeno"],
  ];
  return (
    <div className="flex items-center gap-3 text-xs text-ink-dim flex-wrap">
      {items.map(([cls, label]) => (
        <span key={cls} className="flex items-center gap-1.5">
          <span className={`inline-block w-3 h-3 rounded border ${cls}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
