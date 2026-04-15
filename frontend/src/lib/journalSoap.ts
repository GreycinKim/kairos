export type SoapBody = {
  scripture: string;
  observation: string;
  application: string;
  prayer: string;
};

export const EMPTY_SOAP: SoapBody = {
  scripture: "",
  observation: "",
  application: "",
  prayer: "",
};

/** Stored as JSON in `journal_entries.body`. Legacy HTML/plain entries map into Observation. */
export function parseSoapBody(raw: string | null): SoapBody {
  if (!raw?.trim()) return { ...EMPTY_SOAP };
  const t = raw.trim();
  if (t.startsWith("{")) {
    try {
      const j = JSON.parse(t) as Record<string, unknown>;
      if (j && typeof j === "object") {
        return {
          scripture: typeof j.scripture === "string" ? j.scripture : "",
          observation: typeof j.observation === "string" ? j.observation : "",
          application: typeof j.application === "string" ? j.application : "",
          prayer: typeof j.prayer === "string" ? j.prayer : "",
        };
      }
    } catch {
      /* fall through */
    }
  }
  return { ...EMPTY_SOAP, observation: raw };
}

export function serializeSoapBody(s: SoapBody): string | null {
  const empty =
    !s.scripture.trim() && !s.observation.trim() && !s.application.trim() && !s.prayer.trim();
  if (empty) return null;
  return JSON.stringify({
    scripture: s.scripture,
    observation: s.observation,
    application: s.application,
    prayer: s.prayer,
  });
}
