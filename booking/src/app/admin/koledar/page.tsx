import { prisma } from "@/lib/prisma";
import { SPORT_ICONS, SPORT_LABELS } from "@/lib/config";
import { cancelBooking, deleteBlockedSlot } from "../actions";
import BlockSlotForm from "./BlockSlotForm";

function fmt(date: Date) {
  return date.toLocaleString("sl-SI", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminCalendarPage() {
  const [bookings, blockedSlots] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { gte: new Date() },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { startTime: "asc" },
      take: 50,
    }),
    prisma.blockedSlot.findMany({
      where: { endTime: { gte: new Date() } },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-head text-lg font-bold mb-3">Blokiraj termin</h2>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <BlockSlotForm />
        </div>
      </div>

      {blockedSlots.length > 0 && (
        <div>
          <h2 className="font-head text-lg font-bold mb-3">Blokirani termini</h2>
          <div className="space-y-2">
            {blockedSlots.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-3 text-sm"
              >
                <span>
                  {fmt(b.startTime)} –{" "}
                  {b.endTime.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  <span className="text-ink-dim">{b.reason}</span>
                </span>
                <form action={deleteBlockedSlot.bind(null, b.id)}>
                  <button className="text-red-600 hover:underline font-semibold">Odstrani</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-head text-lg font-bold mb-3">Prihajajoči termini</h2>
        {bookings.length === 0 ? (
          <p className="text-ink-dim text-sm">Ni prihajajočih terminov.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3 text-sm"
              >
                <span className="text-xl">{SPORT_ICONS[b.sport]}</span>
                <span className="font-semibold">{fmt(b.startTime)}</span>
                <span className="text-ink-dim">{SPORT_LABELS[b.sport]}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    b.status === "CONFIRMED"
                      ? "bg-teal-100 text-teal-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {b.status === "CONFIRMED" ? "Potrjeno" : "V obravnavi"}
                </span>
                <span className="text-ink-dim">
                  {b.user ? `${b.user.name} (član)` : `${b.guestName} (gost)`}
                </span>
                <form action={cancelBooking.bind(null, b.id)} className="ml-auto">
                  <button className="text-red-600 hover:underline font-semibold">Prekliči</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
