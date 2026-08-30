import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-head text-2xl font-extrabold text-navy mb-1">Pozabljeno geslo</h1>
      <p className="text-ink-dim text-sm mb-6">
        Vpiši e-pošto, s katero si registriran(a) - poslali ti bomo povezavo za nastavitev novega gesla.
      </p>
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <ForgotPasswordForm />
      </div>
      <p className="text-ink-dim text-xs mt-4">
        <Link href="/prijava" className="text-accent font-semibold hover:underline">
          Nazaj na prijavo
        </Link>
      </p>
    </div>
  );
}
