import { prisma } from "@/lib/prisma";
import { DEFAULT_OPENING_HOUR, DEFAULT_CLOSING_HOUR } from "@/lib/config";

export interface HallHours {
  openingHour: number;
  closingHour: number;
  // 0=Sunday..6=Saturday (JS Date.getDay()).
  closedWeekdays: number[];
}

export async function getHallHours(): Promise<HallHours> {
  const settings = await prisma.hallSettings.findUnique({ where: { id: 1 } });
  return {
    openingHour: settings?.openingHour ?? DEFAULT_OPENING_HOUR,
    closingHour: settings?.closingHour ?? DEFAULT_CLOSING_HOUR,
    closedWeekdays: settings?.closedWeekdays ?? [],
  };
}

export async function updateHallHours(
  openingHour: number,
  closingHour: number,
  closedWeekdays: number[]
) {
  return prisma.hallSettings.upsert({
    where: { id: 1 },
    update: { openingHour, closingHour, closedWeekdays },
    create: { id: 1, openingHour, closingHour, closedWeekdays },
  });
}
