# Ticket Board

A Kanban-style ticket tracker built with React and FastAPI. Tickets move between
four workflow columns by drag and drop, each ticket can be claimed or released by
a signed-in user, and every mutation is authorized server-side against a
revocable session.

- **Frontend:** React 19, TypeScript, React Router, Vite
- **Backend:** FastAPI, async SQLAlchemy 2.0, PostgreSQL (asyncpg), bcrypt
- **Tooling:** uv, pytest, Ruff, ESLint, GitHub Actions

## Features

**Drag-and-drop board.** Tickets live in one of four columns — Backlog, In
Progress, Under Review, Completed — and dragging a card between them persists the
new status. The move is applied optimistically and rolled back in the UI if the
request fails, so the board never shows a state the server rejected.

**Ownership you can claim and release.** A ticket can be unassigned or owned by a
user. Any signed-in user can claim an unowned ticket, the owner can release it
back to the pool, and the board shows an owner badge on each claimed card.

**Session-based authentication, not a login prototype.** Signing up or signing in
issues an opaque 256-bit token in an `HttpOnly` cookie. The server stores only a
SHA-256 digest of that token, so a database leak doesn't hand over live sessions.
Sessions expire after 12 hours and are deleted server-side on sign-out, which
makes them genuinely revocable in a way a stateless JWT is not.

**Authorization that never trusts the client.** The API resolves the current user
from the session cookie alone. Ticket payloads have no `user_id` field and reject
unknown fields outright, so a forged owner ID is a `422` rather than something the
server silently honors. Create, update, and delete all require a session, and
update and delete additionally enforce ownership with a `403`.

**Passwords handled properly.** Credentials are hashed with bcrypt and never
stored or returned in plain text, with length validation to stay inside bcrypt's
72-byte input limit.

**Tested and linted in CI.** Fifteen integration tests cover the authorization
model end to end — missing, invalid, and expired credentials, one user attempting
to mutate another user's ticket, sign-out invalidation, and ownership assignment
and release. GitHub Actions runs pytest and Ruff on every push and pull request.

## Prerequisites

- Python 3.12 and [uv](https://docs.astral.sh/uv/)
- Node.js 20 or newer
- PostgreSQL running locally

## Setup

### 1. Create the database

The application creates its tables on startup, but the database itself must
already exist:

```bash
createdb ticket_db
```

### 2. Configure the backend

Environment files are gitignored, so create `backend/.env` yourself:

```bash
DATABASE_URL="postgresql+asyncpg://localhost/ticket_db"
FRONTEND_URL="http://localhost:5173"
```

Both are required. `DATABASE_URL` has no fallback, and `FRONTEND_URL` is the
origin allowed to make credentialed cross-origin requests.

### 3. Run the backend

```bash
cd backend
uv sync --dev
uv run uvicorn main:app --reload
```

The API serves on `http://127.0.0.1:8000`, with interactive docs at
`http://127.0.0.1:8000/docs`. Keep this port — the frontend dev proxy targets it.

### 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, create an account, and you're on the board.

## Configuration

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | backend | none (required) | Async SQLAlchemy connection URL |
| `FRONTEND_URL` | backend | none (required) | Origin allowed to send credentialed requests |
| `COOKIE_SECURE` | backend | `false` | Set to `true` to mark the session cookie `Secure` |
| `VITE_API_URL` | frontend | `/api` | API base path or URL |

In development, `VITE_API_URL` stays at its `/api` default and Vite proxies that
path to the backend. This matters more than it looks: it keeps API calls
same-origin, and a `SameSite=Lax` cookie is not sent on cross-site requests, so
without the proxy every authenticated call fails depending on whether you browse
`localhost` or `127.0.0.1`. For a deployed frontend, point `VITE_API_URL` at the
API's absolute URL and set `COOKIE_SECURE=true`.

## Tests and linting

```bash
cd backend
uv run pytest
uvx ruff@0.13.0 check .
```

```bash
cd frontend
npm run lint
npm run build   # also typechecks
```

The test suite overrides FastAPI's `get_session` dependency and gives every test
a fresh SQLite database in pytest's temporary directory, so tests never read from
or write to your PostgreSQL database.

## API

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | — | Create an account and start a session |
| `POST` | `/auth/signin` | — | Start a session |
| `GET` | `/auth/me` | session | Current user |
| `POST` | `/auth/signout` | session | Revoke the session |
| `GET` | `/` | — | List all tickets |
| `GET` | `/tickets/{id}` | — | Fetch one ticket |
| `POST` | `/tickets` | session | Create a ticket |
| `PATCH` | `/tickets/{id}` | session + owner | Update status, fields, or ownership |
| `DELETE` | `/tickets/{id}` | session + owner | Delete a ticket |

Ticket reads are intentionally public; every mutation requires a session. An
unowned ticket may be claimed by any signed-in user, while an owned ticket can
only be modified by its owner.

## Project layout

```
backend/
  main.py       FastAPI app, session handling, endpoints
  models.py     SQLAlchemy models: Ticket, User, AuthSession
  schemas.py    Pydantic request and response models
  database.py   Engine and session factory
  tests/        Integration tests over the HTTP API
frontend/src/
  App.tsx       Routing, session restore, board
  api.ts        Fetch wrapper that sends credentials
  components/   Board, ticket cards, forms, auth pages
  types/        Shared TypeScript types
```
