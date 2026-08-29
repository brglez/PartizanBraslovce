"use client";

import { useActionState } from "react";
import { updateHallHoursAction } from "../actions";

// value = JS Date.getDay() (0=Sunday..6=Saturday), listed Monday-first for
// a natural week display.
const WEEKDAYS = [
  { value: 1, label: "Pon" },
  { value: 2, label: "Tor" },
  { value: 3, label: "Sre" },
  { value: 4, label: "Čet" },
  { value: 5, label: "Pet" },
  { value: 6, label: "Sob" },
  { value: 0, label: "Ned" },
];

export default function HallHoursForm({
  openingHour,
  closingHour,
  closedWeekdays,
}: {
  openingHour: number;
  closingHour: number;
  closedWeekdays: number[];
}) {
  const [state, formAction, pending] = useActionState(updateHallHoursAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-5">
      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="openingHour">
          Odprto od
        </label>
        <select
          id="openingHour"
          name="openingHour"
          defaultValue={openingHour}
          className="rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {h}:00
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="closingHour">
          Zaprto ob
        </label>
        <select
          id="closingHour"
          name="closingHour"
          defaultValue={closingHour}
          className="rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        >
          {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
            <option key={h} value={h}>
              {h}:00
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-xs font-semibold mb-1">Zaprti dnevi</span>
        <div className="flex gap-2">
          {WEEKDAYS.map((d) => (
            <label
              key={d.value}
              className="flex flex-col items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold text-ink-dim has-[:checked]:border-accent has-[:checked]:bg-orange-50 has-[:checked]:text-accent-dark cursor-pointer"
            >
              <input
                type="checkbox"
                name="closedWeekdays"
                value={d.value}
                defaultChecked={closedWeekdays.includes(d.value)}
                className="accent-accent"
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-navy px-5 py-2.5 font-semibold text-white hover:bg-navy-alt transition-colors disabled:opacity-60"
      >
        {pending ? "Shranjujem ..." : "Shrani"}
      </button>

      {state?.error && (
        <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
    </form>
  );
}
