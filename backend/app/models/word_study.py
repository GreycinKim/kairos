import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Table, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from app.database import Base


word_study_links = Table(
    "word_study_links",
    Base.metadata,
    Column(
        "word_study_id",
        UUID(as_uuid=True),
        ForeignKey("word_studies.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("note_id", UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
)


class WordStudy(Base):
    __tablename__ = "word_studies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    word = Column(Text, nullable=False)
    transliteration = Column(Text, nullable=True)
    language = Column(Text, nullable=True)
    strongs_number = Column(Text, nullable=True)
    definition = Column(Text, nullable=True)
    extended_notes = Column(Text, nullable=True)
    verse_references = Column(ARRAY(Text), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
