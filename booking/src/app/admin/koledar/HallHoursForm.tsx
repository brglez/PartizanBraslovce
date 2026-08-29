"use client";

import { useActionState } from "react";
import { updateHallHoursAction } from "../actions";

export default function HallHoursForm({
  openingHour,
  closingHour,
}: {
  openingHour: number;
  closingHour: number;
}) {
  const [state, formAction, pending] = useActionState(updateHallHoursAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
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
