import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./LoginForm";

export default async function PrijavaPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-head text-2xl font-extrabold text-navy mb-1">Prijava za člane</h1>
      <p className="text-ink-dim text-sm mb-6">
        Prijavljeni člani lahko rezervirajo termine brez čakanja na potrditev.
      </p>
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
      <p className="text-ink-dim text-xs mt-4">
        Nimate še računa? Za članstvo kontaktirajte upravitelja dvorane.
      </p>
    </div>
  );
}
