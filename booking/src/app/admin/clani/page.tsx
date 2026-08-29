import { prisma } from "@/lib/prisma";
import { removeMember } from "../actions";
import AddMemberForm from "./AddMemberForm";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export default async function AdminMembersPage() {
  const [admins, members] = await Promise.all([
    prisma.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ where: { role: "MEMBER" }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-head text-lg font-bold mb-3">Dodaj člana ali administratorja</h2>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <AddMemberForm />
        </div>
        <p className="text-xs text-ink-dim mt-2">
          Uporabnik si nato geslo lahko spremeni sam po prijavi (funkcija sledi kasneje) ali pa mu
          ga posredujete po varni poti.
        </p>
      </div>

      <div>
        <h2 className="font-head text-lg font-bold mb-3">Administratorji ({admins.length})</h2>
        <div className="space-y-2">
          {admins.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-3 text-sm"
            >
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold">{a.name}</p>
                <p className="text-ink-dim">
                  {a.email} {a.phone && `· ${a.phone}`}
                </p>
              </div>
              <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-semibold text-navy">
                Administrator
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-head text-lg font-bold mb-3">Seznam članov ({members.length})</h2>
        {members.length === 0 ? (
          <p className="text-ink-dim text-sm">Še ni dodanih članov.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-3 text-sm"
              >
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-ink-dim">
                    {m.email} {m.phone && `· ${m.phone}`}
                  </p>
                </div>
                <form action={removeMember.bind(null, m.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`Odstraniti člana ${m.name}?`}
                    pendingLabel="Odstranjujem ..."
                    className="text-red-600 hover:underline font-semibold disabled:opacity-60"
                  >
                    Odstrani
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
