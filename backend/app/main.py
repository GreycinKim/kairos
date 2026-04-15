from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import jbch_hub, journal, memory, milestones, notes, prayer, reader, scripture, search, themes, timeline, word_study

app = FastAPI(title="Kairos API", version="0.1.0")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
# Same Wi‑Fi / LAN: iPad at http://<PC-LAN-IP>:5173 (Vite proxy is same-origin; this covers direct :8000 too).
_lan_dev_origin_re = (
    r"^http://("
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}"
    r"):(5173|4173)$"
)
# Production + preview deploys on Vercel (still set CORS_ORIGINS for your canonical domain).
_vercel_origin_re = r"^https://[\w.-]+\.vercel\.app$"
_cors_origin_re = f"(?:{_lan_dev_origin_re})|(?:{_vercel_origin_re})"
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_origin_regex=_cors_origin_re,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(memory.router, prefix="/api")
app.include_router(timeline.router, prefix="/api")
app.include_router(milestones.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(notes.tags_router, prefix="/api")
app.include_router(notes.links_router, prefix="/api")
app.include_router(journal.router, prefix="/api")
app.include_router(word_study.router, prefix="/api")
app.include_router(prayer.router, prefix="/api")
app.include_router(scripture.router, prefix="/api")
app.include_router(themes.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(jbch_hub.router, prefix="/api")
app.include_router(reader.router, prefix="/api")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
