# CLAUDE.md — sozialApp

Diese Datei dient als vollständiger Leitfaden für KI-Assistenten, die an dieser Codebasis arbeiten. Vor jeder Änderung vollständig lesen.

---

## Projektübersicht

**sozialApp** ist eine soziale Lernplattform für Studierende der Sozialen Arbeit in Deutschland. Sie verbindet:

- **Sozialen Feed** — Beiträge, Likes, Kommentare, Follow-System
- **Wissenschaftliche Recherche** — Direkte Suche in OpenAlex, Semantic Scholar und CrossRef (alle kostenlos)
- **KI-Assistent** — Google Gemini 1.5 Flash (kostenlos) für Formulierungshilfe, Fallanalyse, Recherchehilfe und freien Chat
- **Lerntools** — Karteikarten, Pomodoro-Timer, Zitiergenerator (APA), Notenrechner
- **Netzwerk** — Lerngruppen, Mentor*innen
- **Fachbibliothek & Ressourcen** — kuratierte Literatur und Links

---

## Repository-Struktur

```
/sozialApp
├── CLAUDE.md                  # Diese Datei
├── sozialapp.md               # Ursprüngliche Spezifikation (Referenz)
├── .gitignore
├── client/                    # Frontend — Vanilla HTML/CSS/JS, kein Framework, kein Build-Schritt
│   ├── index.html             # Social Feed + Auth
│   ├── style.css              # Stile für index.html
│   ├── app.js                 # Feed-, Auth-, Follow-, Profillogik
│   ├── research.html          # Forschungsseite (7 Tabs)
│   ├── research.css           # Stile für research.html
│   ├── research.js            # Alle Forschungs-/KI-/Datenbankfunktionen
│   └── assets/                # Bilder, Icons
└── server/                    # Backend — Node.js + Express + MongoDB
    ├── server.js              # Einstiegspunkt: DB-Verbindung, Listen
    ├── app.js                 # Express-App: Middleware, Routen, Rate-Limiting
    ├── package.json           # Abhängigkeiten inkl. @google/generative-ai
    ├── seed.js                # DB-Befüllung mit Beispieldaten
    ├── .env.example           # Vorlage für Umgebungsvariablen
    ├── .gitignore
    ├── models/
    │   ├── User.js            # Benutzermodell (bcryptjs, pre-save-Hook)
    │   ├── Post.js            # Beitragsmodell (Likes, Kommentare)
    │   └── Research.js        # LibraryItem, CaseStudy, Flashcard, Group, Mentor, Resource
    ├── middleware/
    │   └── auth.js            # JWT-Verifikation → req.user.id
    └── routes/
        ├── auth.js            # POST /register, /login
        ├── posts.js           # CRUD, Likes, Kommentare
        ├── research.js        # GET Bibliothek, Fallstudien, Karteikarten, etc.
        ├── users.js           # Profil, Follow/Unfollow
        ├── ai.js              # Claude KI: Formulierung, Fallanalyse, Recherche, Chat
        └── databases.js       # Proxy: OpenAlex, Semantic Scholar, CrossRef + kuratierte Liste
```

---

## Technologie-Stack

| Schicht | Technologie | Hinweis |
|---|---|---|
| Frontend | Vanilla HTML5, CSS3, ES6+ | Kein Framework, kein Build-Schritt |
| Backend | Node.js + Express 4.18.2 | |
| Datenbank | MongoDB 7 + Mongoose 7.0.3 | |
| KI | `@google/generative-ai` → `gemini-1.5-flash` | Kostenlos, 1500 Anfragen/Tag |
| Authentifizierung | JWT (`jsonwebtoken`), bcryptjs (12 Runden) | |
| Rate-Limiting | `express-rate-limit` (30 KI-Anfragen/Min/IP) | |
| Externe APIs | OpenAlex, Semantic Scholar, CrossRef, node-fetch | Alle kostenlos, kein Schlüssel nötig |
| Validierung | `express-validator` | |

---

## Umgebungsvariablen

`server/.env` anlegen (niemals einchecken):

```bash
MONGODB_URI=mongodb://localhost:27017/sozialapp
JWT_SECRET=<sicherer-zufaelliger-schluessel-min-32-zeichen>
GEMINI_API_KEY=AIza...
PORT=5000
```

| Variable | Zweck | Pflicht |
|---|---|---|
| `MONGODB_URI` | MongoDB-Verbindungsstring | Ja |
| `JWT_SECRET` | JWT-Signierungsschlüssel | Ja |
| `GEMINI_API_KEY` | Google Gemini API (aistudio.google.com) | Ja (für KI-Features, kostenlos) |
| `PORT` | HTTP-Port | Nein (Standard: 5000) |

---

## Entwicklungsworkflow

### Ersteinrichtung

```bash
cd server
npm install
cp .env.example .env   # .env ausfüllen
node seed.js           # Datenbank mit Beispieldaten befüllen
npm run dev            # nodemon-Entwicklungsserver auf Port 5000
```

Frontend öffnen: `client/index.html` direkt im Browser oder über beliebigen statischen Server.

### NPM-Skripte

| Befehl | Aktion |
|---|---|
| `npm run dev` | `nodemon server.js` (Hot-Reload, Entwicklung) |
| `npm start` | `node server.js` (Produktion) |
| `npm run seed` | `node seed.js` (Datenbank befüllen) |

---

## API-Referenz

Basis-URL: `http://localhost:5000/api`

### Auth — `/api/auth`

| Methode | Pfad | Body | Antwort |
|---|---|---|---|
| POST | `/register` | `name, username, email, password` | `{ token }` |
| POST | `/login` | `username, password` | `{ token }` |

Validierung: E-Mail-Format, Passwort min. 6 Zeichen, Duplikatprüfung.

### Posts — `/api/posts` *(Auth erforderlich)*

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| POST | `/` | Ja | Beitrag erstellen (max. 1000 Zeichen) |
| GET | `/` | Ja | Alle Beiträge (Feed), neueste zuerst, user populated |
| DELETE | `/:id` | Ja | Nur eigene Beiträge |
| PUT | `/like/:id` | Ja | Liken (kein Duplikat) |
| PUT | `/unlike/:id` | Ja | Entliken |
| POST | `/comment/:id` | Ja | Kommentar hinzufügen (max. 500 Zeichen) |

### Research — `/api/research`

| Methode | Pfad | Parameter | Beschreibung |
|---|---|---|---|
| GET | `/library` | `?search=`, `?category=` | Bücher (Volltext-Suche via Regex) |
| GET | `/cases` | `?category=` | Fallstudien |
| GET | `/flashcards` | — | Alle Karteikarten |
| GET | `/groups` | — | Lerngruppen |
| GET | `/mentors` | — | Mentor*innen |
| GET | `/resources` | — | Externe Ressourcen |

### Benutzer — `/api/users` *(Auth erforderlich)*

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| GET | `/me` | Ja | Eigenes Profil (kein Passwort) |
| PUT | `/me` | Ja | `name, bio, emoji` aktualisieren |
| GET | `/:username/posts` | Nein | Alle Beiträge eines Benutzers |
| PUT | `/follow/:id` | Ja | Folgen (Selbst-Follow verhindert) |
| PUT | `/unfollow/:id` | Ja | Entfolgen |

### KI-Assistent — `/api/ai` *(Auth + Rate-Limit: 30/Min)*

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| POST | `/formulierung` | `text, modus` | Text überarbeiten (verbessern/umformulieren/kuerzen/erweitern/korrektorat) |
| POST | `/fallanalyse` | `name, bereich, situation, hintergrund?, ziele` | Strukturierte KI-Fallanalyse (6 Abschnitte) |
| POST | `/recherche` | `frage, kontext?` | Fachrecherche mit Datenbankempfehlungen |
| POST | `/chat` | `nachricht, verlauf?[]` | Freier Chat (max. 20 Nachrichten Verlauf) |

KI-Modell: `gemini-1.5-flash` (Google, kostenlos) — 1500 Anfragen/Tag, 15/Minute.
Textlimit Formulierung: max. 3000 Zeichen.

### Online-Datenbanken — `/api/databases` *(Auth erforderlich)*

| Methode | Pfad | Parameter | Beschreibung |
|---|---|---|---|
| GET | `/openalex` | `q, seite?` | OpenAlex-Suche (200 Mio+ Werke, kostenlos) |
| GET | `/semanticscholar` | `q, limit?` | Semantic Scholar (KI-gestützt, kostenlos) |
| GET | `/crossref` | `q, rows?` | CrossRef DOI + Metadaten (kostenlos) |
| GET | `/liste` | — | Statische Liste aller empfohlenen Datenbanken (10 Einträge) |

Alle externen APIs sind vollständig kostenlos und benötigen keinen API-Schlüssel.

---

## Datenmodelle

### User
```
name            String, required
username        String, required, unique, trim
email           String, required, unique, lowercase
password        String, required (gehasht via pre-save-Hook, bcryptjs 12 Runden)
bio             String, default: 'Soziale Arbeit Studierende*r'
emoji           String, default: '🎓'
profilePicture  String, default: ''
followers       [ObjectId → User]
following       [ObjectId → User]
createdAt       Date
```
Instanzmethode: `comparePassword(kandidat)` → Boolean

### Post
```
user      ObjectId → User, required
text      String, required, maxlength: 1000
image     String, default: ''
likes     [ObjectId → User]
comments  [{ user: ObjectId, text: String (max 500), createdAt: Date }]
createdAt Date
```

### Research-Modelle (alle in `Research.js`)

| Modell | Felder |
|---|---|
| LibraryItem | title, author, year, category, publisher, description, pages |
| CaseStudy | title, category, alter, emoji, situation, problem, intervention, ergebnis, dauer |
| Flashcard | question, answer |
| Group | name, members (Number), icon, topic |
| Mentor | name, fach, emoji, verfuegbar (Boolean) |
| Resource | icon, name, desc, link |

---

## Frontend-Struktur

### index.html / app.js

**Globaler Zustand:**
```javascript
let currentUser = null;        // Benutzerobjekt aus /api/users/me
let token = localStorage.getItem('token');  // JWT
const API_URL = 'http://localhost:5000/api';
```

**Seitennavigation:** CSS-Klasse `active` auf `.page`-Elementen und `.content-page`-Elementen.

**Auth-Header:** `x-auth-token: <JWT>` — zentrale Hilfsfunktion `api(pfad, optionen)` fügt ihn automatisch hinzu.

**XSS-Schutz:** Alle Benutzerinhalte werden durch `escapeHTML()` geleitet, bevor sie per `innerHTML` gesetzt werden.

### research.html / research.js

**7 Tabs:** `bibliothek`, `datenbanken`, `fallstudien`, `tools`, `ki`, `netzwerk`, `ressourcen`

**URL-Hash-Navigation:** `research.html#ki` öffnet direkt den KI-Assistenten-Tab.

**KI-Unterbereiche:** `formulierung`, `fallanalyse`, `recherche`, `chat` — über `.ki-tab`-Buttons umgeschaltet.

**Datenbank-Switcher:** `openalex`, `semanticscholar`, `crossref`, `uebersicht` — bei `uebersicht` werden Suchfeld und Infobanner ausgeblendet.

**Markdown-Rendering:** Einfache Funktion `renderMarkdown(text)` für KI-Ausgaben (`## Überschrift`, `**fett**`).

**Chat-Verlauf:** Array `chatVerlauf[]` mit `{role, content}`, wird lokal gehalten (max. 20 Einträge an API).

---

## Konventionen

### Sprache
- **Kommentare und Fehlermeldungen:** Deutsch
- **Variablen/Funktionen:** Deutsch (z. B. `aktuelleKarte`, `timerLaeuft`, `zeigeKarte`)
- **Mongoose-Feldnamen:** Gemischt (domänenspezifisch: `alter`, `ergebnis`, `verfuegbar`, `dauer`, `fach`)
- **HTTP-Antworten (`msg`-Felder):** Deutsch

### Backend-Konventionen
- Route-Handler: `async/await` + `try/catch`, Fehler als `res.status(N).json({ msg: '...' })`
- Validierung: `express-validator`-Checks in Auth-Routen; manuelle Checks in anderen Routen
- Benutzer-Populate: `['name', 'username', 'emoji']` — niemals `password` mitsenden
- Posts-Sortierung: `.sort({ createdAt: -1 })` (neueste zuerst)
- Autorisierungsprüfung vor Delete: `post.user.toString() !== req.user.id`
- Passwort wird niemals im Klartext gespeichert oder in Antworten zurückgegeben (`.select('-password')`)

### Frontend-Konventionen
- **Kein Framework, kein Build** — reines ES6+ DOM-Manipulation
- **XSS:** Alle dynamischen Inhalte durch `escapeHTML()` leiten
- **Ladebutton-Status:** `setLaden(btnId, true/false)` deaktiviert Button und zeigt Spinner
- **Token-Key in localStorage:** `'token'`
- Umleitungsschutz auf `research.js`: Wenn kein Token → sofort zu `index.html`
- CSS-Variablen aus `--gruen`, `--blau`, `--lila` für konsistentes Farbschema

### KI-Integration
- Modell: `gemini-1.5-flash` (Google, völlig kostenlos — 1500 Anfragen/Tag, kein Kreditkarte)
- API-Schlüssel: kostenlos via https://aistudio.google.com/app/apikey
- System-Prompt: wird als `systemInstruction` bei Modellinitialisierung übergeben
- Chat-Verlauf: Gemini verwendet `role: 'model'` statt `'assistant'` → wird in ai.js gemappt
- Datenschutz-Hinweis im UI: Keine realen Klientdaten eingeben
- Rate-Limiting: 30 Anfragen/Minute/IP via `express-rate-limit`
- Textlimits: Formulierung max. 3000 Zeichen, Chat-Verlauf max. 20 Nachrichten

### Externe Datenbank-APIs
- Alle Aufrufe laufen **serverseitig** (verhindert CORS-Probleme im Browser)
- User-Agent: `SozialApp/1.0 (sozialapp@example.com)` — empfohlen von OpenAlex und CrossRef
- Timeout: 8 Sekunden pro externer Anfrage
- Seitengröße: max. 15 Ergebnisse pro Anfrage

---

## Sicherheitshinweise

| Aspekt | Regel |
|---|---|
| Passwörter | Niemals im Klartext — immer bcryptjs (12 Runden) |
| JWT | Ablauf: 24h; Geheimschlüssel min. 32 Zeichen |
| XSS | `escapeHTML()` für alle Benutzerdaten im Frontend |
| Autorisierung | Eigentumscheck vor Beitrags-Löschen |
| Secrets | `.env` und `node_modules/` in `.gitignore` |
| CORS | Global via `cors()`-Middleware |
| Rate-Limiting | KI-Endpunkte: 30/Min/IP |
| Datenschutz | KI-Prompts dürfen keine realen Klientdaten enthalten |

---

## Kostenlose Ressourcen für Recherche

| Datenbank | Zugang | API | Besonderheit |
|---|---|---|---|
| **OpenAlex** | Kostenlos, kein Account | Ja (integriert) | 200 Mio+ Werke, bester Allrounder |
| **Semantic Scholar** | Kostenlos, kein Account | Ja (integriert) | KI-Zitationsanalyse |
| **CrossRef** | Kostenlos, kein Account | Ja (integriert) | DOI-Auflösung |
| **SSOAR** | Kostenlos, kein Account | Nein (Link) | Deutschsprachige Sozialwissenschaften |
| **BASE** | Kostenlos, kein Account | Nein (Link) | 350 Mio+ Open-Access-Dokumente |
| **DOAJ** | Kostenlos, kein Account | Nein (Link) | Nur peer-reviewed OA-Journals |
| **DZI SoLit** | Hochschullizenz | Nein (Link) | Spezialdatenbank Soziale Arbeit |
| **FIS Bildung** | Kostenlos | Nein (Link) | Bildung & Erziehung |

---

## Tests

Kein Test-Framework konfiguriert. Empfehlung bei Bedarf:
- **Backend:** Jest + Supertest
- **Frontend:** Playwright (E2E)

---

## Git-Workflow

- Entwicklungsbranch: `claude/add-claude-documentation-scliP`
- Commit-Nachrichten: Englisch, prägnant
- Push: `git push -u origin <branch-name>`
- Niemals direkt auf `main` pushen

---

## Bekannte Eigenheiten

- `sozialapp.md` ist die ursprüngliche Spezifikation — bei Widersprüchen hat die tatsächliche Implementierung Vorrang
- `node-fetch` Version 2.x wird verwendet (CommonJS-kompatibel mit `require()`) — nicht Version 3+
- Das Frontend kommuniziert lokal mit `http://localhost:5000/api` — für Deployment `API_URL` in `app.js` und `research.js` anpassen
- Externe Datenbank-APIs (OpenAlex etc.) werden serverseitig proxied, um CORS zu umgehen
