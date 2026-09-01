"use client";

import { useActionState, useState } from "react";
import { notifyFreedSlot } from "../actions";

// Same local-time -> ISO conversion as BlockSlotForm.tsx.
function toIso(localValue: string): string {
  if (!localValue) return "";
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default function NotifyFreedSlotForm() {
  const [state, formAction, pending] = useActionState(notifyFreedSlot, undefined);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
      <input type="hidden" name="startTime" value={toIso(startLocal)} />
      <input type="hidden" name="endTime" value={toIso(endLocal)} />
      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="freedStart">
          Od
        </label>
        <input
          id="freedStart"
          type="datetime-local"
          required
          value={startLocal}
          onChange={(e) => setStartLocal(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="freedEnd">
          Do
        </label>
        <input
          id="freedEnd"
          type="datetime-local"
          required
          value={endLocal}
          onChange={(e) => setEndLocal(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold mb-1" htmlFor="freedMessage">
          Sporočilo (neobvezno)
        </label>
        <input
          id="freedMessage"
          name="message"
          placeholder="npr. Termin je oddan zaradi odpovedi ..."
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-4 rounded-full bg-navy py-2.5 font-semibold text-white hover:bg-navy-alt transition-colors disabled:opacity-60"
      >
        {pending ? "Pošiljam ..." : "Obvesti člane"}
      </button>
      {state?.error && (
        <p className="sm:col-span-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.sent && (
        <p className="sm:col-span-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
          Obvestilo poslano.
        </p>
      )}
    </form>
  );
}
