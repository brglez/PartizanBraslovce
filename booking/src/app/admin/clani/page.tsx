import { prisma } from "@/lib/prisma";
import { removeMember } from "../actions";
import AddMemberForm from "./AddMemberForm";

export default async function AdminMembersPage() {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-head text-lg font-bold mb-3">Dodaj člana</h2>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <AddMemberForm />
        </div>
        <p className="text-xs text-ink-dim mt-2">
          Član si nato geslo lahko spremeni sam po prijavi (funkcija sledi kasneje) ali pa mu ga
          posredujete po varni poti.
        </p>
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
                  <button className="text-red-600 hover:underline font-semibold">Odstrani</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
