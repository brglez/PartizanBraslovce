import { prisma } from "@/lib/prisma";
import { SPORT_ICONS, SPORT_LABELS } from "@/lib/config";
import { approveBooking, rejectBooking } from "./actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

function fmt(date: Date) {
  return date.toLocaleString("sl-SI", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDashboard() {
  const [pending, upcomingConfirmed, memberCount] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "PENDING" },
      orderBy: { startTime: "asc" },
    }),
    prisma.booking.count({
      where: { status: "CONFIRMED", startTime: { gte: new Date() } },
    }),
    prisma.user.count({ where: { role: "MEMBER" } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Čaka na potrditev" value={pending.length} accent />
        <Stat label="Potrjeni prihodnji termini" value={upcomingConfirmed} />
        <Stat label="Aktivni člani" value={memberCount} />
      </div>

      <div>
        <h2 className="font-head text-lg font-bold mb-3">Zahteve gostov, ki čakajo</h2>
        {pending.length === 0 ? (
          <p className="text-ink-dim text-sm">Trenutno ni čakajočih zahtev. 🎉</p>
        ) : (
          <div className="space-y-3">
            {pending.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <span className="text-2xl">{SPORT_ICONS[b.sport]}</span>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold">
                    {SPORT_LABELS[b.sport]} &middot; {fmt(b.startTime)}–
                    {b.endTime.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm text-ink-dim">
                    {b.guestName} &middot; {b.guestEmail} &middot; {b.guestPhone}
                  </p>
                  {b.notes && <p className="text-sm text-ink-dim italic">&ldquo;{b.notes}&rdquo;</p>}
                </div>
                <div className="flex gap-2">
                  <form action={approveBooking.bind(null, b.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="Potrditi to rezervacijo?"
                      pendingLabel="Potrjujem ..."
                      className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-60"
                    >
                      Potrdi
                    </ConfirmSubmitButton>
                  </form>
                  <form action={rejectBooking.bind(null, b.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="Zavrniti to rezervacijo?"
                      pendingLabel="Zavračam ..."
                      className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                      Zavrni
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className={`font-head text-3xl font-extrabold ${accent ? "text-accent" : "text-navy"}`}>
        {value}
      </p>
      <p className="text-sm text-ink-dim">{label}</p>
    </div>
  );
}
