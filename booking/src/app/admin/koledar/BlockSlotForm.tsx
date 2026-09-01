"use client";

import { useActionState, useState } from "react";
import { createBlockedSlot } from "../actions";
import { SPORT_LABELS } from "@/lib/config";

// datetime-local inputs give a naive local string; convert to a real ISO
// (UTC) instant client-side using the admin's own browser timezone before
// it ever reaches the server, so the stored slot matches the wall-clock
// time the admin picked regardless of the server's timezone.
function toIso(localValue: string): string {
  if (!localValue) return "";
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default function BlockSlotForm() {
  const [state, formAction, pending] = useActionState(createBlockedSlot, undefined);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
      <input type="hidden" name="startTime" value={toIso(startLocal)} />
      <input type="hidden" name="endTime" value={toIso(endLocal)} />
      <div className="sm:col-span-1">
        <label className="block text-xs font-semibold mb-1" htmlFor="startTimeLocal">
          Od
        </label>
        <input
          id="startTimeLocal"
          type="datetime-local"
          required
          value={startLocal}
          onChange={(e) => setStartLocal(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-semibold mb-1" htmlFor="endTimeLocal">
          Do
        </label>
        <input
          id="endTimeLocal"
          type="datetime-local"
          required
          value={endLocal}
          onChange={(e) => setEndLocal(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-semibold mb-1" htmlFor="reason">
          Razlog
        </label>
        <input
          id="reason"
          name="reason"
          required
          placeholder="Turnir, vzdrževanje ..."
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-semibold mb-1" htmlFor="blockSport">
          Dejavnost (za ikono)
        </label>
        <select
          id="blockSport"
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-navy py-2.5 font-semibold text-white hover:bg-navy-alt transition-colors disabled:opacity-60"
      >
        {pending ? "Dodajam ..." : "Blokiraj termin"}
      </button>
      {state?.error && (
        <p className="sm:col-span-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
