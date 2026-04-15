# Kairos

Personal Bible study and spiritual journaling app: one timeline for Scripture, world history, and your walk with God.

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Fuse.js, Tiptap (`@tiptap/react`), `@uiw/react-md-editor` (notes / word study)
- **Backend:** FastAPI, SQLAlchemy (async), Alembic, PostgreSQL, httpx (verse text from bible-api.com)
- **Auth:** JWT-ready settings (not wired in UI for local MVP)

## Prerequisites

- Node 20+
- Python 3.11+
- Docker (optional, for PostgreSQL)

## Database

```bash
cd kairos
docker compose up -d
```

The Compose file maps Postgres to **host port 5433** so it does not collide with another PostgreSQL service on 5432. Copy `backend/.env.example` to `backend/.env` and adjust if needed.

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Migration `002_prayer_scripture_themes` adds prayers, scripture links, themes, theme tags, and timeline columns (`era`, `author`, written-year range for composition markers). It removes the old `genre` column from `timeline_events`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). When the UI is served from `localhost` or `127.0.0.1`, the browser calls **`http://127.0.0.1:8000/api`** directly (CORS), so the chapter reader works without relying on the Vite proxy. From another hostname (e.g. LAN IP), requests use **`/api`** (proxy in dev, or your reverse proxy in production). Override anytime with **`VITE_API_BASE_URL`** (e.g. `https://api.example.com/api`).

## Routes

| Path | Purpose |
|------|---------|
| `/timeline` | Unified timeline: Scripture (blue), world (amber), personal (sage); spiritual-style view lives here (layer toggles / modes) |
| `/journal` | Daily journal; Tiptap body; moods; themes; `?date=` deep link |
| `/notes` | All notes; `?note=` deep link |
| `/word-study` | Greek/Hebrew bank; `?study=` deep link |
| `/scripture` | Verse-centric links, graph, previews (dedicated page) |
| `/scripture/flow` | Sermon passage maps: sermon notes (markdown) synced with an interactive passage canvas |
| `/scripture/maps` | Biblical geography: static Leaflet map (AWMC tiles, routes, filters) in `public/bible-map/` |
| `/prayer` | Kanban by status; `?prayer=` opens a prayer |
| `/search` | Global search across major entity types |

Legacy URLs `/spiritual-timeline` and `/themes` redirect to `/timeline`.

## Features

- **Timeline:** Era labels, BC as negative years, “Today” on the personal layer, layer toggles, fuzzy search, add events.
- **Notes drawer:** Event click → markdown editor with auto-save, tags, themes, wiki links.
- **Journal:** Date picker, mood, HTML body (Tiptap), prayer fields, themes, link to timeline event.
- **Word studies:** List + detail; Fuse search.
- **Prayers / scripture / theme tags:** Full CRUD via API where applicable; scripture verse text fetched server-side when previewing.
- **Search:** `GET /api/search?q=` returns grouped hits; UI navigates with query hints.
- **Memory (read-only API):** `GET /api/memory/feed?limit=` merges recent rows from timeline, notes, journal, prayers, word studies, reader highlights and verse notes, scripture links, milestones, and themes (newest first). `GET /api/memory/summary` returns counts per kind.

## Seed data

`python -m scripts.seed` loads themes, 66 Bible books (narrative span + written span where modeled), major empires, salvation (March 11, 2022), and a sample Greek word study (*kairos*). Bible book ranges live in `backend/scripts/bible_seed.py`.

## Deep links (search → page)

Search results use hints such as `?event=`, `?date=`, `?note=`, `?study=`, `?prayer=` so the target page can focus the right row. Theme name hits open `/timeline`.
