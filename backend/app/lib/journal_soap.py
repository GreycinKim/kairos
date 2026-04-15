"""Journal `body` may be SOAP JSON or legacy HTML/text."""

from __future__ import annotations

import json
from typing import Any


def journal_body_plain_text(body: str | None) -> str | None:
    """Flatten body for snippets / search display."""
    if not body or not body.strip():
        return None
    raw = body.strip()
    if raw.startswith("{"):
        try:
            d = json.loads(raw)
            if isinstance(d, dict):
                parts: list[str] = []
                for key in ("scripture", "observation", "application", "prayer"):
                    v = d.get(key)
                    if isinstance(v, str) and v.strip():
                        parts.append(v.strip())
                if parts:
                    return " ".join(parts)
        except (json.JSONDecodeError, TypeError):
            pass
    return raw
