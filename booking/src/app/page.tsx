import { startOfWeek, addDays } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import WeekCalendar from "@/components/WeekCalendar";
import { HALL_NAME, PRICE_PER_HOUR_EUR } from "@/lib/config";
import { getHallHours } from "@/lib/settings";

export default async function Home() {
  const session = await auth();
  const isMember = !!session?.user;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  const [{ openingHour, closingHour, closedWeekdays }, bookings, blockedSlots] = await Promise.all([
    getHallHours(),
    prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: weekEnd },
        endTime: { gt: weekStart },
      },
      select: { id: true, sport: true, startTime: true, endTime: true, status: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedSlot.findMany({
      where: { startTime: { lt: weekEnd }, endTime: { gt: weekStart } },
      select: { id: true, startTime: true, endTime: true, reason: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-accent font-semibold text-sm uppercase tracking-wide mb-1">
          {HALL_NAME}
        </p>
        <h1 className="font-head text-3xl md:text-4xl font-extrabold text-navy mb-2">
          Rezerviraj svoj termin 🏸🏐🏀
        </h1>
        <p className="text-ink-dim max-w-xl">
          Poklikaj proste termine v koledarju spodaj (najmanj eno uro) in spodaj potrdi z
          &bdquo;Rezerviraj&ldquo;. Cena najema je {PRICE_PER_HOUR_EUR}&nbsp;€/uro za celo dvorano.{" "}
          {isMember
            ? "Kot prijavljen član je tvoja rezervacija potrjena takoj."
            : "Rezervacije gostov potrdi upravitelj po e-pošti ali telefonu."}
        </p>
      </div>

      <WeekCalendar
        isMember={isMember}
        openingHour={openingHour}
        closingHour={closingHour}
        closedWeekdays={closedWeekdays}
        initialWeekStart={weekStart.toISOString()}
        initialBookings={bookings.map((b) => ({
          ...b,
          status: b.status as "PENDING" | "CONFIRMED",
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
        }))}
        initialBlockedSlots={blockedSlots.map((b) => ({
          ...b,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
        }))}
      />
    </div>
  );
}
