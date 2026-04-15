export type WorkspaceMapCatalogEntry = { id: string; file: string; title: string };

/** Display order for section headings (unknown keys sort last). */
export const WORKSPACE_MAP_SECTION_ORDER: string[] = [
  "Life of Jesus · travel maps (Gospels)",
  "01–08 · Patriarchs, Canaan & wilderness",
  "09–14 · The land, conquest & tribal Israel",
  "15–21 · Judges through divided kingdom",
  "22–27 · Empires, exile & return",
  "28–31 · Greek world & Hasmoneans",
  "32–37 · Rome, Herod, Jesus & Acts (Israel)",
  "38–43 · Mediterranean, Paul & Revelation",
  "Regional & other plates",
];

export function workspaceMapSection(entry: WorkspaceMapCatalogEntry): string {
  if (/^LOJ-/i.test(entry.file) || entry.id.startsWith("ws-loj-")) {
    return "Life of Jesus · travel maps (Gospels)";
  }
  const m = entry.file.match(/^(\d{2})\s/);
  const digits = m?.[1];
  if (!digits) return "Regional & other plates";
  const n = parseInt(digits, 10);
  if (n <= 8) return "01–08 · Patriarchs, Canaan & wilderness";
  if (n <= 14) return "09–14 · The land, conquest & tribal Israel";
  if (n <= 21) return "15–21 · Judges through divided kingdom";
  if (n <= 27) return "22–27 · Empires, exile & return";
  if (n <= 31) return "28–31 · Greek world & Hasmoneans";
  if (n <= 37) return "32–37 · Rome, Herod, Jesus & Acts (Israel)";
  if (n <= 43) return "38–43 · Mediterranean, Paul & Revelation";
  return "Regional & other plates";
}

export function groupWorkspaceMapsBySection(entries: WorkspaceMapCatalogEntry[]): Map<string, WorkspaceMapCatalogEntry[]> {
  const map = new Map<string, WorkspaceMapCatalogEntry[]>();
  for (const e of entries) {
    const key = workspaceMapSection(e);
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }));
  }
  return map;
}

export function orderedSectionKeys(map: Map<string, WorkspaceMapCatalogEntry[]>): string[] {
  const keys = [...map.keys()];
  keys.sort((a, b) => {
    const ia = WORKSPACE_MAP_SECTION_ORDER.indexOf(a);
    const ib = WORKSPACE_MAP_SECTION_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return keys;
}
