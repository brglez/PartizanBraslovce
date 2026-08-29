import { prisma } from "@/lib/prisma";
import { SPORT_ICONS, SPORT_LABELS } from "@/lib/config";
import { getHallHours } from "@/lib/settings";
import { cancelBooking, deleteBlockedSlot, deleteBlockedSlotSeries } from "../actions";
import BlockSlotForm from "./BlockSlotForm";
import RecurringBlockForm from "./RecurringBlockForm";
import HallHoursForm from "./HallHoursForm";

function fmt(date: Date) {
  return date.toLocaleString("sl-SI", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("sl-SI", { day: "numeric", month: "short", year: "numeric" });
}

function fmtWeekday(date: Date) {
  return date.toLocaleDateString("sl-SI", { weekday: "long" });
}

export default async function AdminCalendarPage() {
  const [hallHours, bookings, blockedSlots] = await Promise.all([
    getHallHours(),
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

  const singleBlocks = blockedSlots.filter((b) => !b.seriesId);
  const seriesGroups = new Map<string, typeof blockedSlots>();
  for (const b of blockedSlots) {
    if (!b.seriesId) continue;
    const group = seriesGroups.get(b.seriesId);
    if (group) group.push(b);
    else seriesGroups.set(b.seriesId, [b]);
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-head text-lg font-bold mb-3">Čas obratovanja</h2>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <HallHoursForm
            openingHour={hallHours.openingHour}
            closingHour={hallHours.closingHour}
            closedWeekdays={hallHours.closedWeekdays}
          />
        </div>
      </div>

      <div>
        <h2 className="font-head text-lg font-bold mb-3">Blokiraj termin</h2>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <BlockSlotForm />
        </div>
      </div>

      <div>
        <h2 className="font-head text-lg font-bold mb-3">Ponavljajoča blokada (npr. cela sezona)</h2>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <RecurringBlockForm />
        </div>
      </div>

      {seriesGroups.size > 0 && (
        <div>
          <h2 className="font-head text-lg font-bold mb-3">Ponavljajoče blokade</h2>
          <div className="space-y-2">
            {[...seriesGroups.entries()].map(([seriesId, group]) => {
              const first = group[0];
              return (
                <div
                  key={seriesId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-3 text-sm"
                >
                  <span>
                    Vsak <strong className="capitalize">{fmtWeekday(first.startTime)}</strong>{" "}
                    {fmtTime(first.startTime)}–{fmtTime(first.endTime)}
                    {" · "}
                    <span className="text-ink-dim">{first.reason}</span>
                    {" · "}
                    <span className="text-ink-dim">
                      {group.length} termin(ov), do {fmtDate(group[group.length - 1].startTime)}
                    </span>
                  </span>
                  <form action={deleteBlockedSlotSeries.bind(null, seriesId)}>
                    <button className="text-red-600 hover:underline font-semibold">
                      Odstrani celotno serijo
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {singleBlocks.length > 0 && (
        <div>
          <h2 className="font-head text-lg font-bold mb-3">Blokirani termini</h2>
          <div className="space-y-2">
            {singleBlocks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-3 text-sm"
              >
                <span>
                  {fmt(b.startTime)} – {fmtTime(b.endTime)}
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
