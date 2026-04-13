# CLAUDE.md — sozialApp

This file guides AI assistants working on this codebase. Read it fully before making changes.

---

## Project Overview

**sozialApp** is a social learning platform for social work (*Soziale Arbeit*) students. It combines:
- A social feed (posts, likes, comments, follow system)
- Research and study tools (library, case studies, flashcards, Pomodoro timer, citation generator, grade calculator)
- Collaboration features (study groups, mentors, external resources)

**Current state:** The repository contains one file — `sozialapp.md` — which is the complete specification including full source code snippets. No source files have been scaffolded yet. When implementing, follow `sozialapp.md` exactly.

---

## Repository Structure (Target)

```
/sozialApp
├── CLAUDE.md               # This file
├── sozialapp.md            # Full specification with source code
├── client/                 # Frontend — vanilla HTML/CSS/JS, no framework
│   ├── index.html          # Main social feed page
│   ├── style.css           # Main styles
│   ├── app.js              # Feed, auth, follow, profile logic
│   ├── research.html       # Research & study tools page
│   ├── research.css        # Research page styles
│   ├── research.js         # Library, flashcards, tools, network logic
│   └── assets/             # Images and icons
└── server/                 # Backend — Express.js + MongoDB
    ├── server.js            # Entry point: env, DB connect, listen
    ├── app.js               # Express app: middleware, route mounting
    ├── package.json
    ├── seed.js              # Data seeding script
    ├── models/
    │   ├── User.js
    │   ├── Post.js
    │   └── Research.js      # LibraryItem, CaseStudy, Flashcard, Group, Mentor, Resource
    ├── routes/
    │   ├── auth.js          # POST /api/auth/register, /api/auth/login
    │   ├── posts.js         # CRUD + likes + comments
    │   ├── research.js      # GET endpoints for research data
    │   └── users.js         # Profile, follow/unfollow
    └── middleware/
        └── auth.js          # JWT verification middleware
```

---

## Technology Stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla HTML5, CSS3, ES6+ JavaScript (no build step) |
| Backend | Node.js + Express 4.18.2 |
| Database | MongoDB 7 via Mongoose 7.0.3 |
| Auth | JWT (`jsonwebtoken` 9.0.0), passwords hashed with `bcryptjs` (12 rounds) |
| File upload | `multer` 1.4.5-lts.1 |
| Dev server | `nodemon` 2.0.22 |
| API client | Browser Fetch API |

---

## Environment Variables

Create `server/.env` (never commit it):

```
MONGODB_URI=mongodb://localhost:27017/sozialapp
JWT_SECRET=<strong-random-secret>
PORT=5000
```

| Variable | Purpose | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | required |
| `JWT_SECRET` | JWT signing secret | required |
| `PORT` | HTTP port | `5000` |

---

## Development Workflow

### Setup

```bash
cd server
npm install
npm run dev        # nodemon hot-reload on port 5000
```

Frontend is static — open `client/index.html` directly in a browser or serve with any static server. No build step required.

### Seeds

```bash
cd server
node seed.js       # Populate DB with initial research data
```

### Scripts (`server/package.json`)

| Command | Action |
|---|---|
| `npm start` | `node server.js` (production) |
| `npm run dev` | `nodemon server.js` (development) |
| `npm test` | Not implemented — placeholder only |

---

## API Reference

Base URL: `/api` (dev: `http://localhost:5000/api`)

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register: name, username, email, password (≥6 chars). Returns JWT. |
| POST | `/login` | No | Login: username, password. Returns JWT (1 h expiry). |

### Posts — `/api/posts`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Yes | Create post (text + optional image via multer) |
| GET | `/` | No | All posts, newest first, user populated |
| DELETE | `/:id` | Yes | Delete own post only |
| PUT | `/like/:id` | Yes | Like post (no duplicates) |
| PUT | `/unlike/:id` | Yes | Unlike post |
| POST | `/comment/:id` | Yes | Add comment |

### Research — `/api/research`

| Method | Path | Description |
|---|---|---|
| GET | `/library` | Books; supports `?search=` and `?category=` query params |
| GET | `/cases` | Case studies; supports `?category=` |
| GET | `/flashcards` | All flashcards |
| GET | `/groups` | Study groups |
| GET | `/mentors` | Mentors |
| GET | `/resources` | External resources |

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | Yes | Current user profile |
| PUT | `/me` | Yes | Update name, bio, emoji |
| GET | `/:username/posts` | No | All posts by user |
| PUT | `/follow/:id` | Yes | Follow user |
| PUT | `/unfollow/:id` | Yes | Unfollow user |

### Authentication Header

Protected routes require: `x-auth-token: <JWT>`

---

## Data Models

### User
```
name, username (unique), email (unique), password (hashed),
bio, emoji, profilePicture, followers[], following[], createdAt
```
- Pre-save hook hashes password with bcryptjs (12 rounds)
- `comparePassword(candidate)` instance method for login

### Post
```
user (ref User), text, image, likes[] (ref User),
comments[{user, text, createdAt}], createdAt
```

### Research Models (all in `Research.js`)
- **LibraryItem:** title, author, year, category, publisher, description, pages
- **CaseStudy:** title, category, alter, emoji, situation, problem, intervention, ergebnis, dauer
- **Flashcard:** question, answer
- **Group:** name, members, icon, topic
- **Mentor:** name, fach, emoji, verfuegbar (Boolean)
- **Resource:** icon, name, desc, link

---

## Code Conventions

### Language
- Domain terminology and comments are in **German** (matches the target audience).
- Variable/function names are English except domain-specific nouns (e.g., `ergebnis`, `alter`, `verfuegbar`).

### Backend
- Each resource has its own Express Router module in `routes/`.
- Auth middleware reads `x-auth-token`, verifies JWT, attaches `req.user.id`.
- Route handlers use `async/await` with `try/catch`; errors are logged via `console.error` and returned as JSON `{ msg: '...' }`.
- Validation happens inside route handlers (check for duplicates with Mongoose queries).
- Use Mongoose `.populate()` for user data in post responses.
- Sort posts by `createdAt` descending: `.sort({ createdAt: -1 })`.

### Frontend
- No frameworks — plain ES6+ DOM manipulation.
- Global state: `currentUser`, `token` (from `localStorage`), `API_URL`.
- All API calls use `async/await` + Fetch API; include `x-auth-token` header for protected endpoints.
- Dynamic HTML is built with template literals (avoid `innerHTML` with unsanitized user content).
- `localStorage` key for token: `'token'`.
- Tab-based navigation pattern on the research page.
- CSS 3D transforms used for flashcard flip animation.

### Styling
- Emoji used as decorative icons and avatars throughout the UI.
- Card-based layouts for posts and content items.
- Responsive grid layouts where needed.

---

## Security Notes

- Never store plaintext passwords — always use bcryptjs.
- JWT secret must be a strong random value; never hardcode it.
- Token expiry is 1 hour (`{ expiresIn: '1h' }`).
- Authorization checks are required on destructive operations: verify `post.user.toString() === req.user.id` before allowing delete.
- Do not expose the `.env` file or `node_modules/` — add both to `.gitignore`.
- CORS is enabled globally via the `cors` middleware.

---

## Testing

No test suite is configured. When adding tests:
- Recommended: Jest + Supertest for backend route testing
- Add scripts to `package.json` and update this section

---

## Git Workflow

- Feature branches follow the pattern `claude/<description>-<id>`.
- Commit messages should be concise and descriptive in English.
- Push with `git push -u origin <branch-name>`.
- Do **not** push to `main` directly.

---

## Key File to Read First

Before writing any code, read **`sozialapp.md`** — it contains the complete implementation spec including full source code for every file. Implement files exactly as specified there unless given explicit instructions to deviate.
