# CLAUDE.md — sozialApp

Diese Datei dient als Leitfaden für KI-Assistenten, die an dieser Codebasis arbeiten. Bitte vollständig lesen, bevor Änderungen vorgenommen werden.

---

## Projektübersicht

**sozialApp** ist eine soziale Lernplattform für Studierende der Sozialen Arbeit. Sie umfasst:
- Einen sozialen Feed (Beiträge, Likes, Kommentare, Follow-System)
- Forschungs- und Lernwerkzeuge (Bibliothek, Fallstudien, Karteikarten, Pomodoro-Timer, Zitiergenerator, Notenrechner)
- Kollaborationsfunktionen (Lerngruppen, Mentoren, externe Ressourcen)

**Aktueller Stand:** Das Repository enthält genau eine Datei — `sozialapp.md` — die die vollständige Spezifikation inklusive aller Quellcode-Ausschnitte enthält. Es wurden noch keine Quelldateien angelegt. Bei der Implementierung ist `sozialapp.md` als verbindliche Vorlage zu verwenden.

---

## Repository-Struktur (Zielzustand)

```
/sozialApp
├── CLAUDE.md               # Diese Datei
├── sozialapp.md            # Vollständige Spezifikation mit Quellcode
├── client/                 # Frontend — Vanilla HTML/CSS/JS, kein Framework
│   ├── index.html          # Hauptseite mit sozialem Feed
│   ├── style.css           # Hauptstile
│   ├── app.js              # Feed-, Auth-, Follow- und Profillogik
│   ├── research.html       # Forschungs- und Lernwerkzeuge
│   ├── research.css        # Stile für die Forschungsseite
│   ├── research.js         # Bibliothek, Karteikarten, Tools, Netzwerklogik
│   └── assets/             # Bilder und Icons
└── server/                 # Backend — Express.js + MongoDB
    ├── server.js            # Einstiegspunkt: Umgebungsvariablen, DB-Verbindung, Listen
    ├── app.js               # Express-App: Middleware, Routen-Einbindung
    ├── package.json
    ├── seed.js              # Skript zur Datenbankbefüllung
    ├── models/
    │   ├── User.js
    │   ├── Post.js
    │   └── Research.js      # LibraryItem, CaseStudy, Flashcard, Group, Mentor, Resource
    ├── routes/
    │   ├── auth.js          # POST /api/auth/register, /api/auth/login
    │   ├── posts.js         # CRUD + Likes + Kommentare
    │   ├── research.js      # GET-Endpunkte für Forschungsdaten
    │   └── users.js         # Profil, Follow/Unfollow
    └── middleware/
        └── auth.js          # JWT-Verifikations-Middleware
```

---

## Technologie-Stack

| Schicht | Technologie |
|---|---|
| Frontend | Vanilla HTML5, CSS3, ES6+ JavaScript (kein Build-Schritt) |
| Backend | Node.js + Express 4.18.2 |
| Datenbank | MongoDB 7 über Mongoose 7.0.3 |
| Authentifizierung | JWT (`jsonwebtoken` 9.0.0), Passwörter gehasht mit `bcryptjs` (12 Runden) |
| Datei-Upload | `multer` 1.4.5-lts.1 |
| Entwicklungsserver | `nodemon` 2.0.22 |
| API-Client | Browser Fetch API |

---

## Umgebungsvariablen

`server/.env` anlegen (niemals einchecken):

```
MONGODB_URI=mongodb://localhost:27017/sozialapp
JWT_SECRET=<sicherer-zufaelliger-schluessel>
PORT=5000
```

| Variable | Zweck | Standard |
|---|---|---|
| `MONGODB_URI` | MongoDB-Verbindungsstring | Pflichtfeld |
| `JWT_SECRET` | Geheimschlüssel für JWT-Signierung | Pflichtfeld |
| `PORT` | HTTP-Port | `5000` |

---

## Entwicklungsworkflow

### Einrichtung

```bash
cd server
npm install
npm run dev        # nodemon mit Hot-Reload auf Port 5000
```

Das Frontend ist statisch — `client/index.html` direkt im Browser öffnen oder über einen beliebigen statischen Server ausliefern. Kein Build-Schritt erforderlich.

### Datenbankbefüllung (Seed)

```bash
cd server
node seed.js       # Datenbank mit initialen Forschungsdaten befüllen
```

### Skripte (`server/package.json`)

| Befehl | Aktion |
|---|---|
| `npm start` | `node server.js` (Produktion) |
| `npm run dev` | `nodemon server.js` (Entwicklung) |
| `npm test` | Nicht implementiert — nur Platzhalter |

---

## API-Referenz

Basis-URL: `/api` (Entwicklung: `http://localhost:5000/api`)

### Authentifizierung — `/api/auth`

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| POST | `/register` | Nein | Registrierung: name, username, email, password (≥6 Zeichen). Gibt JWT zurück. |
| POST | `/login` | Nein | Anmeldung: username, password. Gibt JWT zurück (Ablauf: 1 Stunde). |

### Beiträge — `/api/posts`

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| POST | `/` | Ja | Beitrag erstellen (Text + optionales Bild via multer) |
| GET | `/` | Nein | Alle Beiträge, neueste zuerst, mit Benutzerangaben |
| DELETE | `/:id` | Ja | Nur eigene Beiträge löschen |
| PUT | `/like/:id` | Ja | Beitrag liken (keine Duplikate) |
| PUT | `/unlike/:id` | Ja | Like entfernen |
| POST | `/comment/:id` | Ja | Kommentar hinzufügen |

### Forschung — `/api/research`

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/library` | Bücher; unterstützt `?search=` und `?category=` |
| GET | `/cases` | Fallstudien; unterstützt `?category=` |
| GET | `/flashcards` | Alle Karteikarten |
| GET | `/groups` | Lerngruppen |
| GET | `/mentors` | Mentoren |
| GET | `/resources` | Externe Lernressourcen |

### Benutzer — `/api/users`

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| GET | `/me` | Ja | Eigenes Benutzerprofil abrufen |
| PUT | `/me` | Ja | Name, Bio, Emoji aktualisieren |
| GET | `/:username/posts` | Nein | Alle Beiträge eines Benutzers |
| PUT | `/follow/:id` | Ja | Benutzer folgen |
| PUT | `/unfollow/:id` | Ja | Benutzer entfolgen |

### Authentifizierungs-Header

Geschützte Routen erfordern: `x-auth-token: <JWT>`

---

## Datenmodelle

### User (Benutzer)
```
name, username (eindeutig), email (eindeutig), password (gehasht),
bio, emoji, profilePicture, followers[], following[], createdAt
```
- Pre-save-Hook hasht das Passwort mit bcryptjs (12 Runden)
- Instanzmethode `comparePassword(kandidat)` für die Anmeldung

### Post (Beitrag)
```
user (ref User), text, image, likes[] (ref User),
comments[{user, text, createdAt}], createdAt
```

### Forschungsmodelle (alle in `Research.js`)
- **LibraryItem:** title, author, year, category, publisher, description, pages
- **CaseStudy:** title, category, alter, emoji, situation, problem, intervention, ergebnis, dauer
- **Flashcard:** question, answer
- **Group:** name, members, icon, topic
- **Mentor:** name, fach, emoji, verfuegbar (Boolean)
- **Resource:** icon, name, desc, link

---

## Konventionen

### Sprache
- Fachbegriffe und Kommentare im Code sind auf **Deutsch** (entspricht der Zielgruppe).
- Variablen- und Funktionsnamen sind auf Englisch, außer domänenspezifische Begriffe (z. B. `ergebnis`, `alter`, `verfuegbar`).

### Backend
- Jede Ressource hat ein eigenes Express-Router-Modul in `routes/`.
- Die Auth-Middleware liest `x-auth-token`, verifiziert das JWT und hängt `req.user.id` an.
- Route-Handler verwenden `async/await` mit `try/catch`; Fehler werden via `console.error` geloggt und als JSON `{ msg: '...' }` zurückgegeben.
- Validierung erfolgt innerhalb der Route-Handler (Duplikatprüfung über Mongoose-Abfragen).
- Mongoose `.populate()` für Benutzerdaten in Beitrags-Antworten verwenden.
- Beiträge absteigend nach `createdAt` sortieren: `.sort({ createdAt: -1 })`.

### Frontend
- Kein Framework — reines ES6+ DOM-Manipulation.
- Globaler Zustand: `currentUser`, `token` (aus `localStorage`), `API_URL`.
- Alle API-Aufrufe mit `async/await` + Fetch API; bei geschützten Endpunkten `x-auth-token`-Header mitschicken.
- Dynamisches HTML wird mit Template-Literals erstellt (kein `innerHTML` mit unsanitisierten Benutzerdaten).
- `localStorage`-Schlüssel für den Token: `'token'`.
- Tab-basierte Navigation auf der Forschungsseite.
- CSS 3D-Transforms für die Karteikarten-Umdreh-Animation.

### Styling
- Emojis als dekorative Icons und Avatare in der gesamten Oberfläche.
- Karten-basierte Layouts für Beiträge und Inhalte.
- Responsive Grid-Layouts wo nötig.

---

## Sicherheitshinweise

- Passwörter niemals im Klartext speichern — immer bcryptjs verwenden.
- Der JWT-Secret-Schlüssel muss ein starker Zufallswert sein; niemals hardcoden.
- Token-Ablauf: 1 Stunde (`{ expiresIn: '1h' }`).
- Bei destruktiven Operationen Autorisierung prüfen: `post.user.toString() === req.user.id` vor dem Löschen verifizieren.
- `.env` und `node_modules/` nicht ins Repository einchecken — beide in `.gitignore` aufnehmen.
- CORS ist global über die `cors`-Middleware aktiviert.

---

## Tests

Kein Test-Framework konfiguriert. Bei Bedarf empfohlen:
- **Jest + Supertest** für Backend-Routen-Tests
- Skripte in `package.json` eintragen und diesen Abschnitt aktualisieren

---

## Git-Workflow

- Feature-Branches folgen dem Muster `claude/<beschreibung>-<id>`.
- Commit-Nachrichten sind kurz und beschreibend auf Englisch.
- Push mit `git push -u origin <branch-name>`.
- Niemals direkt auf `main` pushen.

---

## Wichtigste Datei zuerst lesen

Vor dem Schreiben von Code zuerst **`sozialapp.md`** lesen — sie enthält die vollständige Implementierungsspezifikation inklusive Quellcode für jede Datei. Dateien werden exakt nach dieser Vorlage implementiert, sofern keine abweichenden Anweisungen vorliegen.
