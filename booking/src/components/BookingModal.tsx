"use client";

import { useState } from "react";
import { SPORT_LABELS, SPORT_ICONS, PRICE_PER_HOUR_EUR } from "@/lib/config";

interface Props {
  startTime: Date;
  endTime: Date;
  isMember: boolean;
  onClose: () => void;
  onBooked: () => void;
}

const SPORTS = ["BADMINTON", "ODBOJKA", "KOSARKA", "DRUGO"] as const;

export default function BookingModal({ startTime, endTime, isMember, onClose, onBooked }: Props) {
  const [sport, setSport] = useState<(typeof SPORTS)[number]>("BADMINTON");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dateLabel = startTime.toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = `${startTime.getHours().toString().padStart(2, "0")}:00–${endTime
    .getHours()
    .toString()
    .padStart(2, "0")}:00`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: notes || undefined,
          ...(isMember
            ? {}
            : { guestName, guestEmail, guestPhone }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nekaj je šlo narobe.");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      onBooked();
    } catch {
      setError("Napaka pri povezavi. Poskusite znova.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">{isMember ? "✅" : "📨"}</p>
            <h3 className="font-head text-xl font-bold mb-2">
              {isMember ? "Termin potrjen!" : "Zahteva poslana!"}
            </h3>
            <p className="text-ink-dim mb-6">
              {isMember
                ? "Vaš termin je rezerviran."
                : "Vašo rezervacijo bo pregledal upravitelj in vas obvestil po e-pošti."}
            </p>
            <button
              onClick={onClose}
              className="rounded-full bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-dark transition-colors"
            >
              Zapri
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="font-head text-xl font-bold mb-1">Rezervacija termina</h3>
            <p className="text-ink-dim mb-5 capitalize">
              {dateLabel} &middot; {timeLabel} &middot; {PRICE_PER_HOUR_EUR}&nbsp;€
            </p>

            <label className="block text-sm font-semibold mb-1.5">Šport</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {SPORTS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSport(s)}
                  className={`rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-colors ${
                    sport === s
                      ? "border-accent bg-orange-50 text-accent-dark"
                      : "border-border text-ink-dim hover:border-accent/40"
                  }`}
                >
                  <span className="block text-lg">{SPORT_ICONS[s]}</span>
                  {SPORT_LABELS[s]}
                </button>
              ))}
            </div>

            {!isMember && (
              <>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="guestName">
                  Ime in priimek
                </label>
                <input
                  id="guestName"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full mb-3 rounded-lg border border-border bg-[#fafbfd] px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
                  placeholder="Janez Novak"
                />
                <label className="block text-sm font-semibold mb-1.5" htmlFor="guestEmail">
                  E-pošta
                </label>
                <input
                  id="guestEmail"
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full mb-3 rounded-lg border border-border bg-[#fafbfd] px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
                  placeholder="janez@example.com"
                />
                <label className="block text-sm font-semibold mb-1.5" htmlFor="guestPhone">
                  Telefon
                </label>
                <input
                  id="guestPhone"
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full mb-3 rounded-lg border border-border bg-[#fafbfd] px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
                  placeholder="070 123 456"
                />
                <p className="text-xs text-ink-dim mb-4">
                  Kot gost vaša rezervacija čaka na potrditev upravitelja. Za takojšnjo
                  potrditev se{" "}
                  <a href="/prijava" className="text-accent font-semibold hover:underline">
                    prijavite kot član
                  </a>
                  .
                </p>
              </>
            )}

            <label className="block text-sm font-semibold mb-1.5" htmlFor="notes">
              Opomba (neobvezno)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full mb-4 rounded-lg border border-border bg-[#fafbfd] px-3 py-2.5 text-sm focus:outline-none focus:border-accent resize-none"
              placeholder="Št. igralcev, posebne želje ..."
            />

            {error && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-border py-2.5 font-semibold text-ink-dim hover:bg-gray-50 transition-colors"
              >
                Prekliči
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-full bg-accent py-2.5 font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-60"
              >
                {submitting ? "Pošiljam ..." : isMember ? "Rezerviraj" : "Pošlji zahtevo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
