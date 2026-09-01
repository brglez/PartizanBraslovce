import { startOfWeek, addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { SPORT_ICONS, SPORT_LABELS } from "@/lib/config";
import { getHallHours } from "@/lib/settings";
import { approveBooking, rejectBooking, cancelBooking, deleteBlockedSlot, deleteBlockedSlotSeries } from "../actions";
import BlockSlotForm from "./BlockSlotForm";
import RecurringBlockForm from "./RecurringBlockForm";
import NotifyFreedSlotForm from "./NotifyFreedSlotForm";
import HallHoursForm from "./HallHoursForm";
import WeekCalendar from "@/components/WeekCalendar";
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
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  const [hallHours, bookings, blockedSlots, weekBookings, weekBlockedSlots, groups] = await Promise.all([
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
    prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: weekEnd },
        endTime: { gt: weekStart },
      },
      select: {
        id: true,
        sport: true,
        startTime: true,
        endTime: true,
        status: true,
        guestName: true,
        user: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedSlot.findMany({
      where: { startTime: { lt: weekEnd }, endTime: { gt: weekStart } },
      select: { id: true, startTime: true, endTime: true, reason: true, sport: true },
    }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
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
        <h2 className="font-head text-lg font-bold mb-3">Pregled koledarja</h2>
        <p className="text-xs text-ink-dim mb-2">
          Klikni na zaseden/blokiran termin, da ga sprostiš (velja tudi za posamezen termin
          znotraj ponavljajoče blokade).
        </p>
        <WeekCalendar
          readOnly
          isMember={false}
          openingHour={hallHours.openingHour}
          closingHour={hallHours.closingHour}
          closedWeekdays={hallHours.closedWeekdays}
          onCancelBooking={cancelBooking}
          onDeleteBlocked={deleteBlockedSlot}
          initialWeekStart={weekStart.toISOString()}
          initialBookings={weekBookings.map((b) => ({
            id: b.id,
            sport: b.sport,
            status: b.status as "PENDING" | "CONFIRMED",
            startTime: b.startTime.toISOString(),
            endTime: b.endTime.toISOString(),
            bookedBy: b.user ? `${b.user.name} (član)` : `${b.guestName} (gost)`,
          }))}
          initialBlockedSlots={weekBlockedSlots.map((b) => ({
            ...b,
            startTime: b.startTime.toISOString(),
            endTime: b.endTime.toISOString(),
            sport: b.sport ?? undefined,
          }))}
        />
      </div>

      <div>
        <h2 className="font-head text-lg font-bold mb-3">Prihajajoči termini</h2>
        {bookings.length === 0 ? (
          <p className="text-ink-dim text-sm">Ni prihajajočih terminov.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div
                key={b.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm ${
                  b.status === "PENDING" ? "border-amber-200 bg-amber-50" : "border-border bg-white"
                }`}
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
                  {b.user
                    ? `${b.user.name} (član)`
                    : `${b.guestName} (gost) · ${b.guestEmail} · ${b.guestPhone}`}
                </span>
                {b.notes && (
                  <span className="text-ink-dim italic w-full sm:w-auto">&ldquo;{b.notes}&rdquo;</span>
                )}
                <div className="ml-auto flex gap-3">
                  {b.status === "PENDING" ? (
                    <>
                      <form action={approveBooking.bind(null, b.id)}>
                        <ConfirmSubmitButton
                          confirmMessage="Potrditi to rezervacijo?"
                          pendingLabel="Potrjujem ..."
                          className="text-teal-700 hover:underline font-semibold disabled:opacity-60"
                        >
                          Potrdi
                        </ConfirmSubmitButton>
                      </form>
                      <form action={rejectBooking.bind(null, b.id)}>
                        <ConfirmSubmitButton
                          confirmMessage="Zavrniti to rezervacijo?"
                          pendingLabel="Zavračam ..."
                          className="text-red-600 hover:underline font-semibold disabled:opacity-60"
                        >
                          Zavrni
                        </ConfirmSubmitButton>
                      </form>
                    </>
                  ) : (
                    <form action={cancelBooking.bind(null, b.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="Preklicati to rezervacijo in sprostiti termin?"
                        pendingLabel="Prekličem ..."
                        className="text-red-600 hover:underline font-semibold disabled:opacity-60"
                      >
                        Prekliči
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        <h2 className="font-head text-lg font-bold mb-3">Ponavljajoč termin (npr. cela sezona)</h2>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <RecurringBlockForm groups={groups} />
        </div>
      </div>

      <div>
        <h2 className="font-head text-lg font-bold mb-3">Obvesti člane o sprostitvi termina</h2>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <NotifyFreedSlotForm />
        </div>
        <p className="text-xs text-ink-dim mt-2">
          Pošlje e-pošto vsem članom, ki so vklopili obveščanje, z izbranim terminom in povezavo do
          rezervacijske platforme.
        </p>
      </div>

      {seriesGroups.size > 0 && (
        <div>
          <h2 className="font-head text-lg font-bold mb-3">Ponavljajoči termini</h2>
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
                    <ConfirmSubmitButton
                      confirmMessage={`Odstraniti celotno serijo (${group.length} terminov)?`}
                      pendingLabel="Odstranjujem ..."
                      className="text-red-600 hover:underline font-semibold disabled:opacity-60"
                    >
                      Odstrani celotno serijo
                    </ConfirmSubmitButton>
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
                  <ConfirmSubmitButton
                    confirmMessage="Odstraniti to blokado?"
                    pendingLabel="Odstranjujem ..."
                    className="text-red-600 hover:underline font-semibold disabled:opacity-60"
                  >
                    Odstrani
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
