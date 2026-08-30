"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { resetPassword } from "./actions";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && password !== confirm;

  if (state?.success) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          Geslo je uspešno spremenjeno.
        </p>
        <Link
          href="/prijava"
          className="block w-full rounded-full bg-accent py-2.5 text-center font-semibold text-white hover:bg-accent-dark transition-colors"
        >
          Prijava
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="block text-sm font-semibold mb-1.5">
          Novo geslo
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
          placeholder="Najmanj 8 znakov"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-semibold mb-1.5">
          Ponovi novo geslo
        </label>
        <input
          id="confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
        />
        {mismatch && <p className="mt-1 text-xs text-red-600">Gesli se ne ujemata.</p>}
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending || mismatch || password.length < 8}
        className="w-full rounded-full bg-accent py-2.5 font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-60"
      >
        {pending ? "Shranjujem ..." : "Nastavi novo geslo"}
      </button>
    </form>
  );
}
