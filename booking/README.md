# Rezervacije – Telovadnica Partizan Braslovče

Rezervacijska platforma za telovadnico (badminton / odbojka / košarka). Ena
rezervacija zaseda celo dvorano za izbrano uro. Ločeno od tega ima igrišče za
odbojko na mivki že svojo rezervacijsko rešitev (sportifiq.com), ki ostaja
nespremenjena.

## Kako deluje

- **Koledar** (`/`) – tedenski pregled prostih/zasedenih/blokiranih terminov.
  Vsak lahko klikne prost termin in ga rezervira.
- **Člani** so prijavljeni uporabniki (`/prijava`) – njihova rezervacija je
  **takoj potrjena**.
- **Gostje** rezervirajo brez prijave (ime, e-pošta, telefon) – njihova
  rezervacija je **v obravnavi**, dokler je ne potrdi upravitelj.
- **Admin** (`/admin`, samo za vlogo `ADMIN`) – potrjevanje/zavračanje
  gostujočih zahtev, pregled in preklic terminov, blokiranje termina
  (turnir, vzdrževanje ...) ter dodajanje/urejanje članov.

## Tehnologija

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4, Prisma 7 (PostgreSQL,
`@prisma/adapter-pg`), NextAuth v5 (Credentials, JWT seje).

## Lokalni razvoj

Predpogoj: Node.js 22+, dostop do PostgreSQL (lokalno prek `docker compose up -d`
ali obstoječega strežnika).

```bash
cp .env.example .env       # uredi DATABASE_URL, AUTH_SECRET ...
npm install
docker compose up -d       # lokalni Postgres na :5432 (ali uporabi svojega)
npm run db:migrate         # ustvari tabele
SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=... npm run db:seed
npm run dev                # http://localhost:3000
```

`AUTH_SECRET` generiraš z `openssl rand -base64 32`.

## Produkcijska postavitev (Vercel + gostovana Postgres baza)

1. **Baza**: ustvari brezplačno PostgreSQL bazo, npr. na
   [Neon](https://neon.tech) ali [Supabase](https://supabase.com). Kopiraj
   connection string (`DATABASE_URL`).
2. **Vercel**: uvozi ta repozitorij, nastavi **Root Directory** na `booking/`.
3. Nastavi okoljske spremenljivke v Vercelu:
   - `DATABASE_URL` – iz koraka 1
   - `AUTH_SECRET` – `openssl rand -base64 32`
   - `AUTH_URL` – končna URL naslova (npr. `https://rezervacije.brglez.si`)
   - `ADMIN_NOTIFICATION_EMAIL`
4. Po prvem deployu enkratno poženi migracije in seed admin računa (lokalno,
   z `DATABASE_URL` produkcijske baze v `.env`, ali prek Vercel CLI):
   ```bash
   npm run db:deploy
   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed
   ```
5. **Domena**: priporočeno je gostovanje na poddomeni, npr.
   `rezervacije.brglez.si`, ker gre za ločeno Next.js aplikacijo (glavna
   stran `brglez.si/partizanbraslovce/` ostane statična). Po nastavitvi
   domene posodobi povezave v glavnem `index.html` (trenutno kažejo na
   `https://rezervacije.brglez.si/partizanbraslovce/` kot placeholder).

## Upravljanje članov

Admin lahko v `/admin/clani` doda novega člana (ime, e-pošta, začetno
geslo). Geslo trenutno posreduje ročno (npr. po varnem kanalu); funkcija
"spremeni svoje geslo" za člane še ni implementirana – dodaj jo, ko bo
potrebno.

## Kasneje: spletno plačilo

Model `Booking` že ima polje `paymentStatus` (privzeto `"NONE"`) kot mesto
za kasnejšo integracijo (npr. Stripe): ob rezervaciji člana/potrditvi
gosta bi se ustvaril plačilni link, `paymentStatus` pa bi se posodobil prek
webhooka. To namenoma še ni implementirano.

## Znane omejitve / naslednji koraki

- E-poštna obvestila (potrditev, zavrnitev, novo povpraševanje) še niso
  povezana na pravi e-poštni servis – trenutno se rezervacije spremljajo
  prek `/admin`. Za samodejna obvestila dodaj npr. [Resend](https://resend.com).
- Obratovalni čas dvorane (8:00–22:00) je fiksno nastavljen v
  `src/lib/config.ts` – če se spremeni, uredi tam.
- Član si gesla trenutno ne more sam ponastaviti ("pozabljeno geslo").
