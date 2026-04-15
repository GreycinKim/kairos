"""Populate Kairos with Bible books, empires, themes, salvation milestone. Run: python -m scripts.seed"""

import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Milestone, Theme, TimelineEvent, WordStudy
from scripts.bible_seed import BIBLE_BOOKS, DEFAULT_THEMES, EMPIRES


def seed(session: Session) -> None:
    existing = session.execute(select(TimelineEvent).limit(1)).scalar_one_or_none()
    if existing:
        print("Timeline events already present; skipping seed.")
        return

    for name, color, desc in DEFAULT_THEMES:
        session.add(Theme(name=name, color=color, description=desc))

    for title, era, author, esy, eey, wsy, wey, color, icon in BIBLE_BOOKS:
        session.add(
            TimelineEvent(
                title=title,
                type="bible_book",
                start_year=esy,
                end_year=eey,
                written_start_year=wsy,
                written_end_year=wey,
                era=era,
                author=author,
                description="Biblical book: narrative/event span (bar) vs composition (written marker).",
                color=color,
                icon=icon,
            )
        )

    for title, typ, sy, ey, color, icon in EMPIRES:
        session.add(
            TimelineEvent(
                title=title,
                type=typ,
                start_year=sy,
                end_year=ey,
                description="Major empire (approximate span).",
                color=color,
                icon=icon,
            )
        )

    session.add(
        TimelineEvent(
            title="Salvation",
            type="milestone",
            start_year=None,
            end_year=None,
            start_date=date(2022, 3, 11),
            end_date=date(2022, 3, 11),
            description="Personal milestone — the day of new birth in Christ.",
            color="#c9a84c",
            icon="⭐",
            era="My walk",
        )
    )
    session.flush()

    session.add(
        Milestone(
            title="Salvation",
            milestone_date=date(2022, 3, 11),
            description="Born again — appointed time with God.",
            significance="Anchor of the personal timeline.",
            icon="⭐",
        )
    )

    session.add(
        WordStudy(
            word="καιρός",
            transliteration="kairos",
            language="greek",
            strongs_number="G2540",
            definition='Noun: "due measure," "fit season," "opportunity" — often contrasted with chronos (mere duration).',
            extended_notes="See Mark 1:15 — *ho kairos peplērōtai* (the time is fulfilled).",
            verse_references=["Mark 1:15", "Ephesians 5:16", "Romans 13:11"],
        )
    )

    session.commit()
    print("Seed complete: themes, Bible books (event + written), empires, salvation, word study.")


def main() -> None:
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
