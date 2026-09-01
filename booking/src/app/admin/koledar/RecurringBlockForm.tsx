"use client";

import { useActionState, useMemo, useState } from "react";
import { createRecurringBlockedSlot } from "../actions";
import { SPORT_LABELS } from "@/lib/config";

const WEEKDAYS = [
  { value: 1, label: "Ponedeljek" },
  { value: 2, label: "Torek" },
  { value: 3, label: "Sreda" },
  { value: 4, label: "Četrtek" },
  { value: 5, label: "Petek" },
  { value: 6, label: "Sobota" },
  { value: 0, label: "Nedelja" },
];

const MAX_OCCURRENCES = 200;

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function parseTimeInput(value: string): { h: number; m: number } | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}

// All computed in the admin's own browser timezone, then serialized to ISO
// (UTC) instants before being sent to the server - same approach as the
// one-off BlockSlotForm.
function computeOccurrences(
  weekday: number,
  startTimeStr: string,
  endTimeStr: string,
  seasonStartStr: string,
  seasonEndStr: string
): { startTime: string; endTime: string }[] {
  const seasonStart = parseDateInput(seasonStartStr);
  const seasonEnd = parseDateInput(seasonEndStr);
  const start = parseTimeInput(startTimeStr);
  const end = parseTimeInput(endTimeStr);
  if (!seasonStart || !seasonEnd || !start || !end || seasonEnd < seasonStart) return [];

  const occurrences: { startTime: string; endTime: string }[] = [];
  const now = Date.now();
  const cursor = new Date(seasonStart);
  while (cursor <= seasonEnd && occurrences.length < MAX_OCCURRENCES) {
    if (cursor.getDay() === weekday) {
      const occStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), start.h, start.m);
      const occEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), end.h, end.m);
      if (occEnd > occStart && occStart.getTime() >= now) {
        occurrences.push({ startTime: occStart.toISOString(), endTime: occEnd.toISOString() });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return occurrences;
}

interface Props {
  groups: { id: string; name: string }[];
}

export default function RecurringBlockForm({ groups }: Props) {
  const [state, formAction, pending] = useActionState(createRecurringBlockedSlot, undefined);
  const [weekday, setWeekday] = useState(4);
  const [startTime, setStartTime] = useState("20:30");
  const [endTime, setEndTime] = useState("22:00");
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");

  const occurrences = useMemo(
    () => computeOccurrences(weekday, startTime, endTime, seasonStart, seasonEnd),
    [weekday, startTime, endTime, seasonStart, seasonEnd]
  );

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
      <input type="hidden" name="occurrences" value={JSON.stringify(occurrences)} />

      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="weekday">
          Dan v tednu
        </label>
        <select
          id="weekday"
          value={weekday}
          onChange={(e) => setWeekday(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        >
          {WEEKDAYS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="recurStart">
          Od (ura)
        </label>
        <input
          id="recurStart"
          type="time"
          required
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="recurEnd">
          Do (ura)
        </label>
        <input
          id="recurEnd"
          type="time"
          required
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="seasonStart">
          Sezona od
        </label>
        <input
          id="seasonStart"
          type="date"
          required
          value={seasonStart}
          onChange={(e) => setSeasonStart(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="seasonEnd">
          Sezona do
        </label>
        <input
          id="seasonEnd"
          type="date"
          required
          value={seasonEnd}
          onChange={(e) => setSeasonEnd(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="recurReason">
          Razlog
        </label>
        <input
          id="recurReason"
          name="reason"
          required
          placeholder="Redni najem, trening ..."
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="recurSport">
          Dejavnost (za ikono v koledarju)
        </label>
        <select
          id="recurSport"
          name="sport"
          defaultValue=""
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        >
          <option value="">Brez ikone</option>
          {Object.entries(SPORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="recurGroup">
          Skupina (obvesti člane po e-pošti)
        </label>
        <select
          id="recurGroup"
          name="groupId"
          defaultValue=""
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        >
          <option value="">Brez skupine</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-3 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || occurrences.length === 0}
          className="rounded-full bg-navy px-5 py-2.5 font-semibold text-white hover:bg-navy-alt transition-colors disabled:opacity-60"
        >
          {pending ? "Dodajam ..." : `Blokiraj ${occurrences.length || ""} termin(ov)`}
        </button>
        <span className="text-xs text-ink-dim">
          {seasonStart && seasonEnd
            ? occurrences.length > 0
              ? `Ustvarilo se bo ${occurrences.length} terminov (pretekli in podvojeni datumi so izpuščeni).`
              : "V izbranem obdobju ni prihodnjih terminov na ta dan."
            : "Izberi obdobje sezone."}
        </span>
      </div>

      {state?.error && (
        <p className="sm:col-span-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
