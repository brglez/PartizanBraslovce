"use client";

import { useActionState } from "react";
import { addMember } from "../actions";

export default function AddMemberForm() {
  const [state, formAction, pending] = useActionState(addMember, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="name">
          Ime in priimek
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="email">
          E-pošta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="phone">
          Telefon (neobvezno)
        </label>
        <input
          id="phone"
          name="phone"
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1" htmlFor="password">
          Začetno geslo
        </label>
        <input
          id="password"
          name="password"
          type="text"
          required
          minLength={8}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
        />
      </div>
      <label className="sm:col-span-4 flex items-center gap-2 text-sm font-semibold text-ink-dim">
        <input type="checkbox" name="role" value="ADMIN" className="accent-accent" />
        Naredi administratorja (poln dostop do admin plošče)
      </label>

      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-4 rounded-full bg-navy py-2.5 font-semibold text-white hover:bg-navy-alt transition-colors disabled:opacity-60"
      >
        {pending ? "Dodajam ..." : "Dodaj uporabnika"}
      </button>
      {state?.error && (
        <p className="sm:col-span-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
