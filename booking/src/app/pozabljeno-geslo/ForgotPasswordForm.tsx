"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.message) {
    return <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">{state.message}</p>;
  }

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
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent py-2.5 font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-60"
      >
        {pending ? "Pošiljam ..." : "Pošlji povezavo za ponastavitev"}
      </button>
    </form>
  );
}
