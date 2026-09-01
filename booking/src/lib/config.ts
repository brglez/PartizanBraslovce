// Telovadnica operating rules. Adjust here if opening hours or pricing change.

export const HALL_NAME = "Telovadnica Partizan Braslovče";

// Fallback opening hours, 24h format, used only until an admin sets real
// ones in the database (see lib/settings.ts) or if that row is missing.
export const DEFAULT_OPENING_HOUR = 8;
export const DEFAULT_CLOSING_HOUR = 22;

// One booking occupies the entire hall for this many minutes.
export const SLOT_MINUTES = 30;

export const SPORT_LABELS: Record<string, string> = {
  BADMINTON: "Badminton",
  ODBOJKA: "Rekreacija odbojka",
  KOSARKA: "Košarka",
  REKREACIJA_SKUPINE: "Rekreacija skupine",
  SEDECA_ODBOJKA: "Sedeča odbojka",
  DRUGO: "Drugo",
};

export const SPORT_ICONS: Record<string, string> = {
  BADMINTON: "🏸",
  ODBOJKA: "🏐",
  KOSARKA: "🏀",
  REKREACIJA_SKUPINE: "🤾",
  SEDECA_ODBOJKA: "🪑",
  DRUGO: "🤸",
};

// Cena najema dvorane na uro, odvisna od dejavnosti.
export const SPORT_PRICE_PER_HOUR_EUR: Record<string, number> = {
  BADMINTON: 16,
  ODBOJKA: 21,
  KOSARKA: 21,
  REKREACIJA_SKUPINE: 23,
  SEDECA_ODBOJKA: 23,
  DRUGO: 23,
};
