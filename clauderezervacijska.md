# Rezervacijska platforma – Partizan Braslovče

Ta dokument je povzetek za nadaljevanje dela v drugi seji/na drugem računalniku
(WSL). Prilepi ga v korenski mapo repozitorija, da bo Claude Code takoj imel
kontekst o tem, kaj je bilo narejeno in kaj sledi.

## Kje je koda

- **Repo**: `brglez/PartizanBraslovce` (GitHub)
- **Veja**: `claude/badminton-volleyball-booking-platform-gr3byk`
- Glavni `main` še nima teh sprememb – najprej jih je treba združiti (merge/PR),
  če želiš, da postanejo "uradne".

```bash
git clone https://github.com/brglez/PartizanBraslovce.git
cd PartizanBraslovce
git checkout claude/badminton-volleyball-booking-platform-gr3byk
git pull
```

## Struktura repozitorija

```
PartizanBraslovce/
├── index.html, css/, js/, img/     # obstoječa statična stran (brglez.si/partizanbraslovce)
└── booking/                        # NOVO: rezervacijska aplikacija (Next.js)
```

Statična stran in rezervacijska aplikacija sta **ločeni stvari** – statična
stran se ne spreminja arhitekturno, `booking/` je popolnoma nov, samostojen
projekt znotraj istega repozitorija (monorepo pristop).

## Kaj rezervacijska platforma (`booking/`) počne

Rezervacije za **telovadnico** (badminton / odbojka / košarka). Igrišče za
odbojko na mivki ostaja na obstoječi zunanji platformi (sportifiq.com) –
tega nismo spreminjali.

- **Koledar** (`/`) – tedenski pregled prostih/zasedenih/blokiranih terminov,
  ena rezervacija = cela dvorana za izbrano uro (8:00–22:00).
- **Člani** (prijava na `/prijava`) – rezervacija je **takoj potrjena**.
- **Gostje** (brez računa, ime/e-pošta/telefon) – rezervacija je **v
  obravnavi**, dokler je ne potrdi admin.
- **Admin** (`/admin`, samo vloga `ADMIN`):
  - `/admin` – pregled in potrjevanje/zavračanje čakajočih zahtev
  - `/admin/koledar` – blokiranje terminov (turnir, vzdrževanje), preklic
    rezervacij
  - `/admin/clani` – dodajanje/odstranjevanje članov

## Tehnologija

Next.js 16 (App Router, TypeScript) + Tailwind CSS 4 + Prisma 7
(PostgreSQL, prek `@prisma/adapter-pg`) + NextAuth v5 (Credentials, JWT
seje, brez OAuth). Vizualna identiteta (navy/oranžna/teal, Poppins + Inter)
usklajena z glavno stranjo.

## Lokalni zagon (WSL)

Predpogoj: Node.js 22+, dostop do PostgreSQL (lokalno prek
`docker compose up -d` v `booking/`, ali obstoječ Postgres strežnik).

```bash
cd booking
cp .env.example .env        # uredi DATABASE_URL, AUTH_SECRET ...
npm install
docker compose up -d        # lokalni Postgres na :5432
npm run db:migrate          # ustvari tabele
SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=varno-geslo npm run db:seed
npm run dev                 # http://localhost:3000
```

`AUTH_SECRET` generiraš z `openssl rand -base64 32`.

Vse podrobnosti (tudi produkcijska postavitev na Vercel + gostovana
Postgres baza) so v `booking/README.md`.

## Trenutno stanje

- ✅ Koledar, rezervacije (član/gost), admin plošča – zgrajeno, testirano
  lokalno (build, lint, prijava, gostujoča/članska rezervacija, potrjevanje).
- ✅ Glavna stran (`index.html`) povezana na rezervacijsko aplikacijo
  (kartica telovadnice, pasica z rezervacijami, kontaktni razdelek).
- ⚠️ **Rezervacijska aplikacija še ni postavljena na pravi domeni.**
  Povezave v `index.html` trenutno kažejo na placeholder
  `https://rezervacije.brglez.si/partizanbraslovce/` – ko postaviš pravo
  domeno, poišči in popravi ta URL v `index.html` (3 mesta).
- ⚠️ Na vrhu `index.html` je **začasna oranžna pasica** z opozorilom "Predogled
  nove rezervacijske platforme" in povezavo do demo posnetkov zaslona.
  Ko rezervacijska aplikacija postane prava/živa, jo odstrani: v `index.html`
  poišči komentar `<!-- ZAČASNO: predogled ... -->` in odstrani ta blok
  (`<style>`, `<div class="preview-banner">`, ter `class="has-preview-banner"`
  na `<body>`).
- ❌ Spletno plačilo (Stripe ipd.) še ni implementirano – model `Booking` že
  ima polje `paymentStatus` kot pripravljeno mesto zanj.
- ❌ E-poštna obvestila (potrditev/zavrnitev rezervacije) še niso povezana na
  pravi e-poštni servis (npr. Resend) – trenutno se vse spremlja prek
  `/admin`.
- ❌ Član si gesla (še) ne more sam ponastaviti.

## Statični demo (že narejeno, na `main`, ločeno od `booking/` veje)

Na `main` je zdaj tudi **`rezervacije/`** – čisto statična demo stran
(brez baze, brez Next.js), živa na
`https://brglez.si/partizanbraslovce/rezervacije/`. Namen: pokazati, kako bo
rezervacijska platforma delovala, preden je zgrajena prava aplikacija.

- Tedenski koledar (pon–ned, 8:00–21:00), realni demo urnik telovadnice
  (isti podatki kot v pravem trenutnem urniku – badminton, sedeča odbojka,
  rekreacija ...), vgrajen neposredno v `rezervacije/script.js`.
- Uporabnik lahko označi **več prostih terminov naenkrat** (klik = toggle),
  spodaj se prikaže plavajoča vrstica "N izbranih terminov" z gumboma
  Počisti / Rezerviraj (temno zelena `#0d3b2e`, da izstopa iz navy noge).
- Klik na "Rezerviraj" odpre modal s seznamom vseh izbranih terminov + en
  skupen obrazec (ime/e-pošta/telefon). Oddaja ne pošlje ničesar – pokaže
  opozorilo, da je to osnutek, in usmeri na telefon/e-pošto.
- Na glavni strani (`index.html`) je desno zgoraj v headerju (in v mobilnem
  meniju) viden gumb "Rezervacije (demo)", ki vodi na `/rezervacije/`.
- Ta demo **ni povezan z bazo ali `booking/` vejo** – ko bo prava Next.js
  aplikacija postavljena (glej spodaj), se `rezervacije/` lahko nadomesti
  ali preusmeri nanjo.

## Naslednji koraki (predlog, prava aplikacija iz `booking/` veje)

1. Postavi Postgres bazo (Neon ali Supabase – brezplačen nivo).
2. Deploy `booking/` na Vercel (Root Directory = `booking/`), nastavi env
   spremenljivke (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`,
   `ADMIN_NOTIFICATION_EMAIL`).
3. Poveži poddomeno, npr. `rezervacije.brglez.si`.
4. Popravi placeholder povezave v `index.html` na pravo domeno in odstrani
   začasno pasico predogleda.
5. Po želji: e-poštna obvestila, ponastavitev gesla, spletno plačilo.
6. Ko je prava aplikacija živa: odloči se, ali `rezervacije/` (statični
   demo) ostane kot ločena predstavitvena stran ali se ukine/preusmeri.

## Dostop / gesla

FTP podatki za `brglez.si` niso nikjer shranjeni v repozitoriju ali v tej
seji – če jih rabiš za katerokoli avtomatizacijo, jih vnesi ročno, ne v
javne/deljene datoteke.

Admin račun za rezervacijsko aplikacijo se ustvari z `npm run db:seed`
(glej zgoraj) – geslo hrani samo ti, ni nikjer zapisano v kodi.
