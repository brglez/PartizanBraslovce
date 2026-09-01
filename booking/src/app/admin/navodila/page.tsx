function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h2 className="font-head text-lg font-bold mb-3 text-navy">{title}</h2>
      <div className="space-y-2 text-sm text-ink">{children}</div>
    </div>
  );
}

function Path({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-navy px-1.5 py-0.5 text-xs font-mono text-white">{children}</code>
  );
}

export default function AdminNavodilaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-2xl font-extrabold text-navy mb-1">Navodila za administratorje</h1>
        <p className="text-ink-dim text-sm">
          Vse, kar rabiš vedeti za upravljanje rezervacijske platforme telovadnice.
        </p>
      </div>

      <Section title="1. Pregled koledarja">
        <p>
          Na <Path>/admin/koledar</Path> je na vrhu tedenski pregled celotnega koledarja, z
          imeni rezervantov (tudi gostov) in razlogi blokad izpisanimi neposredno v vsaki celici.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Prosto</strong> (turkizna) &ndash; termin na voljo
          </li>
          <li>
            <strong>Zasedeno</strong> (oranžna, z imenom) &ndash; potrjena rezervacija
          </li>
          <li>
            <strong>V obravnavi</strong> (rumena, z imenom) &ndash; gostova rezervacija čaka na potrditev
          </li>
          <li>
            <strong>Zasedeno</strong> (siva, z razlogom npr. &bdquo;Turnir&ldquo;) &ndash; blokiran termin
          </li>
        </ul>
        <p>
          Če je bila pri blokiranem terminu izbrana dejavnost, se pred besedilom prikaže tudi
          njena ikona (npr. 🏸) &ndash; tako naslednji ali predhodni najemnik na prvi pogled ve, za
          katero dejavnost gre, in mu po potrebi ni treba pospravljati/postavljati mreže.
        </p>
      </Section>

      <Section title="2. Kako potrdim ali zavrnem rezervacijo gosta">
        <p>Rezervacije <strong>članov</strong> se potrdijo samodejno. Rezervacije <strong>gostov</strong> (brez računa) čakajo na tvojo odločitev. Najdeš jih na dveh mestih:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><Path>/admin</Path> &ndash; seznam &bdquo;Zahteve gostov, ki čakajo&ldquo;, gumba <strong>Potrdi</strong> / <strong>Zavrni</strong></li>
          <li><Path>/admin/koledar</Path> &ndash; spodaj pri &bdquo;Prihajajoči termini&ldquo;, rumeno obarvane vrstice (prikažejo tudi kontakt gosta in opombo)</li>
        </ul>
        <p>Klik vedno vpraša za potrditev in med izvajanjem pokaže &bdquo;Potrjujem/Zavračam ...&ldquo;.</p>
      </Section>

      <Section title="3. Kako prekličem termin (tudi neposredno v koledarju)">
        <p>
          Vsak zaseden ali blokiran termin v tedenskem pregledu na <Path>/admin/koledar</Path> je
          klikljiv &ndash; klik vpraša za potrditev in sprosti termin:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Klik na potrjeno/čakajočo rezervacijo jo prekliče (status &bdquo;Preklicano&ldquo;).</li>
          <li>Klik na blokiran termin odstrani <strong>samo ta en termin</strong> &ndash; tudi če je del ponavljajoče serije, ostali termini v seriji ostanejo nespremenjeni.</li>
        </ul>
        <p>
          Isto lahko narediš tudi iz seznama &bdquo;Prihajajoči termini&ldquo; (gumb <strong>Prekliči</strong>) ali iz seznamov blokad spodaj (gumb <strong>Odstrani</strong>).
        </p>
      </Section>

      <Section title="4. Kako dodam trajen (ponavljajoč se) termin">
        <p>
          Na <Path>/admin/koledar</Path> pod &bdquo;Ponavljajoč termin (npr. cela sezona)&ldquo;:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Izberi dan v tednu (npr. četrtek)</li>
          <li>Izberi uro od&ndash;do (lahko poljubna ura, ni nujno poravnano na polno uro, npr. 20:30&ndash;22:00)</li>
          <li>Izberi obdobje sezone (datum od&ndash;do)</li>
          <li>Vpiši razlog (npr. &bdquo;Redni najem&ldquo;)</li>
          <li>Po želji izberi dejavnost (za ikono v koledarju) in skupino (če gre za termin skupine &ndash; glej 9. točko, njeni člani bodo o dodanem/odpovedanem terminu obveščeni po e-pošti)</li>
          <li>Preveri predogled &bdquo;Blokiraj N termin(ov)&ldquo; in potrdi</li>
        </ol>
        <p>Serija se v seznamu prikaže združeno, z enim gumbom &bdquo;Odstrani celotno serijo&ldquo;.</p>
        <p className="text-ink-dim italic">
          Razlog blokade (npr. ime osebe za redni najem) vidi samo prijavljen administrator &ndash;
          na javnem koledarju je prikazano samo generično &bdquo;Zasedeno&ldquo;.
        </p>
      </Section>

      <Section title="5. Kako prekličem trajen termin samo za en dan">
        <p>
          Trajnega termina <strong>ni treba</strong> preklicati v celoti, če ga je treba sprostiti
          samo za en konkreten datum (npr. najemnik en teden ne pride). Preprosto pojdi na
          <Path> /admin/koledar</Path>, poišči ta datum v tedenskem pregledu na vrhu in klikni
          nanj &ndash; odstrani se samo ta en termin, serija za vse ostale tedne ostane nedotaknjena.
        </p>
      </Section>

      <Section title="6. Čas obratovanja in zaprti dnevi">
        <p>
          Na <Path>/admin/koledar</Path> pod &bdquo;Čas obratovanja&ldquo; nastaviš uro odprtja/zaprtja
          telovadnice ter označiš dneve, ko je telovadnica <strong>popolnoma zaprta</strong> (npr.
          nedelja) &ndash; ti dnevi se v koledarju prikažejo sivo in niso rezervabilni.
        </p>
      </Section>

      <Section title="7. Člani in administratorji">
        <p>
          Na <Path>/admin/clani</Path> dodajaš nove uporabnike (ime, e-pošta, telefon, začetno
          geslo). Če obkljukaš &bdquo;Naredi administratorja&ldquo;, dobi nov uporabnik polni dostop
          do admin plošče (enak kot ti).
        </p>
        <p className="text-ink-dim italic">
          Administratorjev prek te strani ni mogoče izbrisati &ndash; to prepreči nesrečo. Člane
          (brez admin pravic) lahko odstraniš z gumbom &bdquo;Odstrani&ldquo;.
        </p>
        <p>
          Pri vsakem članu lahko obkljukaš, v katere <strong>skupine</strong> spada (lahko več
          hkrati), in ali želi prejemati <strong>e-poštna obvestila</strong> &ndash; shrani z gumbom
          &bdquo;Shrani&ldquo; ob njegovem imenu. Glej tudi 9. točko.
        </p>
      </Section>

      <Section title="8. E-poštna obvestila">
        <p>
          Vsi administratorji prejmejo e-pošto ob: novi rezervaciji, potrditvi/zavrnitvi/preklicu
          rezervacije, novi ali odstranjeni blokadi termina (tudi posameznem terminu iz serije) in
          spremembi časa obratovanja &ndash; tako je vsak admin ves čas na tekočem, tudi če
          spremembo naredi kdo drug.
        </p>
      </Section>

      <Section title="9. Skupine in obveščanje članov">
        <p>
          Na <Path>/admin/clani</Path> pod &bdquo;Skupine&ldquo; ustvariš skupino (npr. &bdquo;Četrtkova
          odbojka&ldquo;) in jo pri vsakem članu obkljukaš. Ko nato na <Path>/admin/koledar</Path> pri
          ponavljajočem terminu izbereš to skupino (glej 4. točko), se ob dodajanju ali odstranitvi
          celotne serije samodejno pošlje e-pošta vsem članom te skupine, ki imajo vklopljeno
          obveščanje (7. točka).
        </p>
        <p className="text-ink-dim italic">
          Skupina je namenjena rednim terminom (npr. klubu ali rekreacijski ekipi) &ndash; za
          enkratne blokade (turnir, vzdrževanje) skupina ni potrebna.
        </p>
      </Section>

      <Section title="10. Obveščanje o sprostitvi termina">
        <p>
          Na <Path>/admin/koledar</Path> pod &bdquo;Obvesti člane o sprostitvi termina&ldquo; vpišeš
          datum/uro termina, ki se je sprostil (npr. po odpovedi), po želji dodaš kratko sporočilo
          in klikneš &bdquo;Obvesti člane&ldquo;. E-pošto s terminom, tvojim sporočilom in povezavo do
          rezervacijske platforme prejmejo vsi člani z vklopljenim obveščanjem (7. točka) &ndash;
          tako lahko termin čim prej zasede kdo drug.
        </p>
      </Section>

      <Section title="11. Cene po dejavnosti">
        <p>
          Cena najema ni več enotna &ndash; odvisna je od izbrane dejavnosti (Badminton 16&nbsp;€/uro,
          Rekreacija odbojka/Košarka 21&nbsp;€/uro, Rekreacija skupine/Sedeča odbojka/Drugo
          23&nbsp;€/uro). Cenik urediš v <Path>src/lib/config.ts</Path>
          (&bdquo;SPORT_PRICE_PER_HOUR_EUR&ldquo;), prikaže pa se samodejno tudi na javni strani in v
          rezervacijskem obrazcu.
        </p>
      </Section>
    </div>
  );
}
