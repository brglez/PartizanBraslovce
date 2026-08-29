import Link from "next/link";
import { PRICE_PER_HOUR_EUR } from "@/lib/config";

export default function NavodilaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-accent font-semibold text-sm uppercase tracking-wide mb-1">Pomoč</p>
      <h1 className="font-head text-3xl font-extrabold text-navy mb-6">Kako rezervirati termin</h1>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="font-head text-lg font-bold mb-2 text-navy">Kot član</h2>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm">
            <li>
              Prijavi se na <Link href="/prijava" className="text-accent font-semibold hover:underline">prijavi se</Link>.
            </li>
            <li>
              Na <Link href="/" className="text-accent font-semibold hover:underline">koledarju</Link> poklikaj
              proste termine (obarvani turkizno) &ndash; vsak klik doda pol ure, izbereš lahko uro,
              uro in pol, dve uri in tako naprej (minimalno ena ura).
            </li>
            <li>Spodaj se prikaže vrstica z izbranim terminom &ndash; klikni &bdquo;Rezerviraj&ldquo;.</li>
            <li>Izberi šport in po želji dodaj opombo, nato oddaj.</li>
          </ol>
          <p className="text-sm text-ink-dim mt-3">
            Rezervacija je <strong>takoj potrjena</strong>. Cena najema je {PRICE_PER_HOUR_EUR}&nbsp;€/uro za
            celo dvorano.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="font-head text-lg font-bold mb-2 text-navy">Brez članstva (kot gost)</h2>
          <p className="text-sm">
            Rezervacijo lahko oddaš tudi brez prijave &ndash; enak postopek (izbira termina v
            koledarju), le da ob oddaji vpišeš ime, e-pošto in telefon namesto prijave.
          </p>
          <p className="text-sm text-ink-dim mt-2">
            Gostova rezervacija <strong>čaka na potrditev</strong> upravitelja, ki jo pregleda in
            te obvesti po e-pošti ali telefonu.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="font-head text-lg font-bold mb-2 text-navy">Odbojka na mivki</h2>
          <p className="text-sm">
            Igrišče za odbojko na mivki ni del tega koledarja &ndash; rezervira se ločeno, na{" "}
            <a
              href="https://sd-braslovce.sportifiq.com/"
              target="_blank"
              rel="noopener"
              className="text-accent font-semibold hover:underline"
            >
              sd-braslovce.sportifiq.com
            </a>
            .
          </p>
        </section>

        <section className="rounded-xl border border-accent/30 bg-orange-50 p-5">
          <h2 className="font-head text-lg font-bold mb-2 text-navy">Želiš postati član?</h2>
          <p className="text-sm">
            Za članstvo (takojšnja potrditev rezervacij, brez čakanja na odobritev) pokliči{" "}
            <strong>Žana</strong> na{" "}
            <a href="tel:+38670292363" className="text-accent font-semibold hover:underline">
              070 292 363
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
