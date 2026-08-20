"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
          E-pošta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
          placeholder="ime@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold mb-1.5">
          Geslo
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
          placeholder="••••••••"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent py-2.5 font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-60"
      >
        {pending ? "Prijavljam ..." : "Prijava"}
      </button>
    </form>
  );
}
