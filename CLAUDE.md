# CLAUDE.md — SozialApp

This file documents the codebase structure, development conventions, and workflows for AI assistants working on this project.

---

## Project Overview

**SozialApp** is a social networking platform tailored for students of *Soziale Arbeit* (Social Work) in Germany. It combines a Twitter-like social feed with integrated academic tools: a research library, case-study browser, flashcard system with a Pomodoro timer, citation generator, grade calculator, and a mentoring/networking section.

The project specification is fully documented in `sozialapp.md`. The actual implementation files still need to be scaffolded from that specification.

**Language note:** The project domain, comments, and variable names frequently use German (e.g., `ergebnis` = outcome, `dauer` = duration, `verfuegbar` = available).

---

## Repository State

| Item | Status |
|---|---|
| Specification document | `sozialapp.md` (complete) |
| Backend source files | Not yet created |
| Frontend source files | Not yet created |
| Tests | Not configured |
| Deployment | Planned: Heroku |

When implementing, always derive ground truth from `sozialapp.md`.

---

## Planned Directory Structure

```
/sozialApp
├── client/                    # Vanilla JS frontend
│   ├── index.html             # Auth + social feed page
│   ├── style.css
│   ├── app.js                 # Main frontend logic
│   ├── research.html          # Research & learning tools page
│   ├── research.css
│   ├── research.js
│   └── assets/                # Images and icons
│
├── server/                    # Node.js / Express backend
│   ├── server.js              # Entry point; starts server, connects DB
│   ├── app.js                 # Express app setup; mounts routes
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Research.js        # LibraryItem, CaseStudy, Flashcard, Group, Mentor, Resource
│   ├── routes/
│   │   ├── auth.js            # /api/auth
│   │   ├── posts.js           # /api/posts
│   │   ├── research.js        # /api/research
│   │   └── users.js           # /api/users
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   └── config/                # Reserved for config helpers
│
├── package.json
├── .env                       # Never committed — see Environment Variables
├── sozialapp.md               # Full project specification
└── CLAUDE.md                  # This file
```

---

## Technology Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js | LTS | Runtime |
| Express | ^4.18.2 | HTTP framework |
| Mongoose | ^7.0.3 | MongoDB ODM |
| bcryptjs | ^2.4.3 | Password hashing (12 salt rounds) |
| jsonwebtoken | ^9.0.0 | JWT auth (1 h expiry) |
| cors | ^2.8.5 | Cross-origin headers |
| dotenv | ^16.0.3 | `.env` loading |
| multer | ^1.4.5-lts.1 | File uploads |
| validator | ^13.9.0 | Input validation |
| nodemon | ^2.0.22 | Dev auto-reload |

### Frontend
- HTML5 + CSS3 + **Vanilla JavaScript** (no framework)
- Fetch API for HTTP calls
- `localStorage` for JWT persistence

---

## Environment Variables

Create a `.env` file in the project root (never commit it):

```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/sozialapp
JWT_SECRET=<long-random-secret>
```

---

## Development Scripts

```bash
npm install          # Install dependencies
npm run dev          # Start with nodemon (development)
npm start            # Start with node (production)
```

The dev server runs on `http://localhost:5000` by default.

---

## API Reference

**Base URL (local):** `http://localhost:5000/api`  
**Base URL (production):** `https://sozialapp-backend.herokuapp.com/api`  
**Auth header:** `x-auth-token: <jwt>`

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login; returns JWT |

### Posts (`/api/posts`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | All posts |
| POST | `/` | ✓ | Create post |
| DELETE | `/:id` | ✓ owner | Delete post |
| PUT | `/like/:id` | ✓ | Like post |
| PUT | `/unlike/:id` | ✓ | Unlike post |
| POST | `/comment/:id` | ✓ | Add comment |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | ✓ | Own profile |
| PUT | `/me` | ✓ | Update profile |
| GET | `/:username/posts` | — | User's posts |
| PUT | `/follow/:id` | ✓ | Follow user |
| PUT | `/unfollow/:id` | ✓ | Unfollow user |

### Research (`/api/research`)
| Method | Path | Auth | Query params |
|---|---|---|---|
| GET | `/library` | — | `category`, `search` |
| GET | `/cases` | — | `category` |
| GET | `/flashcards` | — | — |
| GET | `/groups` | — | — |
| GET | `/mentors` | — | — |
| GET | `/resources` | — | — |

---

## Data Models

### User
```js
{ name, username (unique), email (unique), password (hashed),
  bio, emoji, profilePicture,
  followers: [ObjectId], following: [ObjectId], createdAt }
```
Pre-save hook: bcrypt hash with 12 rounds. Instance method: `comparePassword(plain)`.

### Post
```js
{ user: ObjectId, text, image,
  likes: [ObjectId],
  comments: [{ user: ObjectId, text, createdAt }],
  createdAt }
```

### Research models (all in `Research.js`)
- **LibraryItem:** `title, author, year, category, publisher, description, pages`
- **CaseStudy:** `title, category, alter, emoji, situation, problem, intervention, ergebnis, dauer`
- **Flashcard:** `question, answer`
- **Group:** `name, members, icon, topic`
- **Mentor:** `name, fach, emoji, verfuegbar (Boolean)`
- **Resource:** `icon, name, desc, link`

---

## Code Conventions

### General
- **Naming:** camelCase for variables/functions, PascalCase for model/class names, lowercase for route files.
- **Async:** Use `async/await` throughout; wrap route handlers in try/catch.
- **Error responses:** JSON `{ msg: '...' }` with appropriate HTTP status codes (400 client error, 401 unauthenticated, 403 forbidden, 404 not found, 500 server error).
- **Comments:** Written in German to match the existing codebase.

### Backend
- Each route file uses `express.Router()` and is mounted in `server/app.js`.
- Protected routes import and apply `middleware/auth.js` per-route or per-router.
- Models export a single Mongoose model; `Research.js` exports multiple named models.

### Frontend
- Global state variables declared at the top of each script (`currentUser`, `token`, `API_URL`).
- DOM queries use `getElementById()`.
- Template literals generate dynamic HTML.
- Functions are bound directly to HTML element `onclick` attributes or via `addEventListener`.
- `API_URL` constant: `https://sozialapp-backend.herokuapp.com/api` (change for local dev).

### Authentication flow
1. `POST /api/auth/login` → server returns `{ token }`.
2. Client stores token in `localStorage.setItem('token', token)`.
3. All protected requests include header `x-auth-token: <token>`.
4. `middleware/auth.js` calls `jwt.verify()` and attaches `req.user = { id }`.

---

## Testing

No test suite is currently configured. The `test` script in `package.json` exits with an error.

When adding tests:
- Recommended framework: **Jest** with **supertest** for API integration tests.
- Place test files under `server/__tests__/` or co-located as `*.test.js`.
- Run with `npm test`.

---

## Key Source of Truth

All implementation details (full source code for every file) live in **`sozialapp.md`**. Before creating or editing any source file, consult that document for the canonical implementation. The file is structured as consecutive code blocks without explicit section headers — match content by recognizable identifiers (e.g., `mongoose.Schema`, `express.Router`, `const app = express()`).

---

## Git Workflow

- Default development branch: `claude/add-claude-documentation-6NuaD`
- Main branch: `main`
- Commit messages in English, imperative mood (e.g., `Add User model`, `Fix JWT expiry`).
- Never commit `.env` or files containing secrets.
- Push with: `git push -u origin <branch-name>`
