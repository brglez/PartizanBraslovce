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

## Produkcijska postavitev (Hetzner + Coolify)

Gostuje se na obstoječem strežniku za manjše projekte: Hetzner Cloud CX23
(Nürnberg), upravljanem prek [Coolify](https://coolify.io) (self-hosted
PaaS). Repozitorij je monorepo — aplikacija je v podmapi `booking/`, zato je
ključna nastavitev **Base Directory**.

### 1. Postgres v Coolify

V Coolify: **Project → New Resource → Database → PostgreSQL**. Coolify
ustvari servis in poda interno povezovalno nizko (`DATABASE_URL`) — uporabi
**interni** hostname (npr. `postgres-xyz`), ne javnega IP-ja, da promet med
aplikacijo in bazo ne gre prek javnega interneta.

### 2. Next.js aplikacija v Coolify

1. **Project → New Resource → Application → Git repository**, izberi ta
   repozitorij in vejo.
2. **Build Pack**: `Nixpacks` (samodejno prepozna Next.js/npm; ni potreben
   ročni Dockerfile).
3. **Base Directory**: `booking` — pove Coolify, naj obravnava `booking/`
   kot koren projekta (tam so `package.json`, lockfile, `next.config.ts`).
4. **Port**: `3000` (privzet za `next start`).
5. **Domains**: vpiši ciljno domeno, npr. `rezervacije.partizan-braslovce.si` — Coolify
   samodejno uredi HTTPS (Let's Encrypt) ob prvem uspešnem deployu.
6. **Okoljske spremenljivke** (Environment Variables v Coolify):
   - `DATABASE_URL` – interna povezava iz koraka 1
   - `AUTH_SECRET` – `openssl rand -base64 32`
   - `AUTH_URL` – končni URL (npr. `https://rezervacije.partizan-braslovce.si`)
   - `ADMIN_NOTIFICATION_EMAIL`
7. **Deploy**. Nixpacks ob `npm install` samodejno požene `prisma generate`
   (skript `postinstall` v `package.json`), nato `npm run build` in
   `npm run start`.

### 3. Migracije in seed admin računa (enkratno, po prvem deployu)

V Coolify odpri aplikacijo → **Terminal** (poganja ukaz znotraj running
kontejnerja) in zaženi:

```bash
npm run db:deploy
SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed
```

Če Coolify terminal ni na voljo, isto narediš lokalno: v `.env` začasno
vstaviš **javno** povezavo do Postgresa (Coolify jo pokaže poleg interne),
poženeš ista dva ukaza, nato javni dostop do baze v Coolify spet izklopiš.

### 4. DNS

V Hetzner DNS Console dodaj `A` zapis za `rezervacije.partizan-braslovce.si` (ali
izbrano poddomeno) na IP strežnika (`23.88.110.159`). Ko se razveljavi,
Coolify samodejno izda certifikat.

### 5. Po postavitvi

Povezave v glavnem `index.html` že kažejo na `https://rezervacije.partizan-braslovce.si/`
— ni jih treba spreminjati, če se poddomena ujema s tem, kar je nastavljeno
v koraku 4. Odstrani še začasno pasico "Predogled nove rezervacijske
platforme" (označena s komentarjem `<!-- ZAČASNO: ... -->` na vrhu
`index.html`).

### Alternativa: Vercel + Neon/Supabase

Če se raje uporabi upravljana platforma namesto lastnega strežnika, aplikacija
teče tudi na Vercelu brez sprememb — nastavi **Root Directory** na `booking/`,
poveži gostovano Postgres bazo (npr. [Neon](https://neon.tech)) in enake
okoljske spremenljivke kot zgoraj.

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
