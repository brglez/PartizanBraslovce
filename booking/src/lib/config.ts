// Telovadnica operating rules. Adjust here if opening hours or pricing change.

export const HALL_NAME = "Telovadnica Partizan Braslovče";

// Opening hours, 24h format, same every day for now.
export const OPENING_HOUR = 8;
export const CLOSING_HOUR = 22;

// All bookings are whole-hour slots; one booking occupies the entire hall.
export const SLOT_MINUTES = 60;

export const PRICE_PER_HOUR_EUR = 15;

export const SPORT_LABELS: Record<string, string> = {
  BADMINTON: "Badminton",
  ODBOJKA: "Odbojka",
  KOSARKA: "Košarka",
  DRUGO: "Drugo",
};

export const SPORT_ICONS: Record<string, string> = {
  BADMINTON: "🏸",
  ODBOJKA: "🏐",
  KOSARKA: "🏀",
  DRUGO: "🤸",
};
