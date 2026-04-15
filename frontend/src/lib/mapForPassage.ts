/**
 * Maps a Bible passage to a workspace atlas plate (Knowing the Bible set A,
 * or Life of Jesus travel set B when reading the Gospels).
 */

export type PassageMapSet = "A" | "B";

export type PassageMapResult = {
  /** Matches `id` in workspace-maps-catalog.json */
  catalogId: string;
  /** Public asset path (Vite `public/` root). */
  src: string;
  title: string;
  reference: string;
  set: PassageMapSet;
};

const WS = "bible-map/workspace-maps";

const PLATE_FILE: Record<number, string> = {
  1: "01 The Near East.png",
  2: "02 The Table of Nations.png",
  3: "03 The Near East During the Time of the Patriarchs.png",
  4: "04 The Natural Regions of Canaan.png",
  5: "05 The Land of Canaan.png",
  6: "06 The Roadways of Canaan.png",
  7: "07 Canaan During the Time of the Patriarchs.png",
  8: "08 Israels Exodus and Wanderings.png",
  9: "09 The Promised Land.png",
  10: "10 Canaan Before the Conquest of Joshua.png",
  11: "11 Israel After their Defeat of Sihon and Og.png",
  12: "12 The Boundaries of Israel.png",
  13: "13 The Conquest of Canaan Under Joshua.png",
  14: "14 The Tribal Allotments of Israel.png",
  15: "15 Israel During the Time of the Judges.png",
  16: "16 The Kingdom of Saul.png",
  17: "17 The Kingdoms of Ish-Bosheth and David.png",
  18: "18 The Kingdom of David.png",
  19: "19 The Kingdom of Solomon.png",
  20: "20 Solomons Administrative Districts.png",
  21: "21 The Divided Kingdom.png",
  22: "22 The Assyrian Empire.png",
  23: "23 Assyrian Districts in the Land of Israel.png",
  24: "24 The Babylonian Empire.png",
  25: "25 The Median Empire.png",
  26: "26 The Persian Empire.png",
  27: "27 Judah After the Return from Exile.png",
  28: "28 The Greek Empire of Alexander III.png",
  29: "29 The Greek Empire of the Diadochi.png",
  30: "30 The Greek Empire of the Seleucids.png",
  31: "31 Jewish Expansion Under the Hasmoneans.png",
  32: "32 The Rise of the Roman Empire.png",
  33: "33 The Roman Empire.png",
  34: "34 The Kingdom of Herod I.png",
  35: "35 The Division of Herods Kingdom.png",
  36: "36 Israel During the Time of Jesus.png",
  37: "37 Israel During the Time of Acts.png",
  38: "38 The Mediterranean World During the Time of Acts.png",
  39: "39 Pauls First Missionary Journey.png",
  40: "40 Pauls Second Missionary Journey.png",
  41: "41 Pauls Third Missionary Journey.png",
  42: "42 Pauls Journey to Rome.png",
  43: "43 The Churches of Revelation.png",
};

/** Must match `workspace-maps-catalog.json` ids for plates 01–43. */
const PLATE_CATALOG_ID: Record<number, string> = {
  1: "ws-01-the-near-east",
  2: "ws-02-the-table-of-nations",
  3: "ws-03-the-near-east-during-the-time-of-the-patriarchs",
  4: "ws-04-the-natural-regions-of-canaan",
  5: "ws-05-the-land-of-canaan",
  6: "ws-06-the-roadways-of-canaan",
  7: "ws-07-canaan-during-the-time-of-the-patriarchs",
  8: "ws-08-israels-exodus-and-wanderings",
  9: "ws-09-the-promised-land",
  10: "ws-10-canaan-before-the-conquest-of-joshua",
  11: "ws-11-israel-after-their-defeat-of-sihon-and-og",
  12: "ws-12-the-boundaries-of-israel",
  13: "ws-13-the-conquest-of-canaan-under-joshua",
  14: "ws-14-the-tribal-allotments-of-israel",
  15: "ws-15-israel-during-the-time-of-the-judges",
  16: "ws-16-the-kingdom-of-saul",
  17: "ws-17-the-kingdoms-of-ish-bosheth-and-david",
  18: "ws-18-the-kingdom-of-david",
  19: "ws-19-the-kingdom-of-solomon",
  20: "ws-20-solomons-administrative-districts",
  21: "ws-21-the-divided-kingdom",
  22: "ws-22-the-assyrian-empire",
  23: "ws-23-assyrian-districts-in-the-land-of-israel",
  24: "ws-24-the-babylonian-empire",
  25: "ws-25-the-median-empire",
  26: "ws-26-the-persian-empire",
  27: "ws-27-judah-after-the-return-from-exile",
  28: "ws-28-the-greek-empire-of-alexander-iii",
  29: "ws-29-the-greek-empire-of-the-diadochi",
  30: "ws-30-the-greek-empire-of-the-seleucids",
  31: "ws-31-jewish-expansion-under-the-hasmoneans",
  32: "ws-32-the-rise-of-the-roman-empire",
  33: "ws-33-the-roman-empire",
  34: "ws-34-the-kingdom-of-herod-i",
  35: "ws-35-the-division-of-herods-kingdom",
  36: "ws-36-israel-during-the-time-of-jesus",
  37: "ws-37-israel-during-the-time-of-acts",
  38: "ws-38-the-mediterranean-world-during-the-time-of-acts",
  39: "ws-39-pauls-first-missionary-journey",
  40: "ws-40-pauls-second-missionary-journey",
  41: "ws-41-pauls-third-missionary-journey",
  42: "ws-42-pauls-journey-to-rome",
  43: "ws-43-the-churches-of-revelation",
};

const PLATE_TITLE: Record<number, string> = {
  1: "01 The Near East",
  2: "02 The Table of Nations",
  3: "03 The Near East During the Time of the Patriarchs",
  4: "04 The Natural Regions of Canaan",
  5: "05 The Land of Canaan",
  6: "06 The Roadways of Canaan",
  7: "07 Canaan During the Time of the Patriarchs",
  8: "08 Israel’s Exodus and Wanderings",
  9: "09 The Promised Land",
  10: "10 Canaan Before the Conquest of Joshua",
  11: "11 Israel After Their Defeat of Sihon and Og",
  12: "12 The Boundaries of Israel",
  13: "13 The Conquest of Canaan Under Joshua",
  14: "14 The Tribal Allotments of Israel",
  15: "15 Israel During the Time of the Judges",
  16: "16 The Kingdom of Saul",
  17: "17 The Kingdoms of Ish-Bosheth and David",
  18: "18 The Kingdom of David",
  19: "19 The Kingdom of Solomon",
  20: "20 Solomon’s Administrative Districts",
  21: "21 The Divided Kingdom",
  22: "22 The Assyrian Empire",
  23: "23 Assyrian Districts in the Land of Israel",
  24: "24 The Babylonian Empire",
  25: "25 The Median Empire",
  26: "26 The Persian Empire",
  27: "27 Judah After the Return from Exile",
  28: "28 The Greek Empire of Alexander III",
  29: "29 The Greek Empire of the Diadochi",
  30: "30 The Greek Empire of the Seleucids",
  31: "31 Jewish Expansion Under the Hasmoneans",
  32: "32 The Rise of the Roman Empire",
  33: "33 The Roman Empire",
  34: "34 The Kingdom of Herod I",
  35: "35 The Division of Herod’s Kingdom",
  36: "36 Israel During the Time of Jesus",
  37: "37 Israel During the Time of Acts",
  38: "38 The Mediterranean World During the Time of Acts",
  39: "39 Paul’s First Missionary Journey",
  40: "40 Paul’s Second Missionary Journey",
  41: "41 Paul’s Third Missionary Journey",
  42: "42 Paul’s Journey to Rome",
  43: "43 The Churches of Revelation",
};

const LOJ_CATALOG_ID: Record<number, string> = {
  1: "ws-loj-1-birth-to-adulthood",
  2: "ws-loj-2-ministry-begins",
  3: "ws-loj-3-early-ministry",
  4: "ws-loj-4-galilean-ministry",
  5: "ws-loj-5-gentile-ministry",
  6: "ws-loj-6-heading-south",
  7: "ws-loj-7-final-week",
  8: "ws-loj-8-post-resurrection",
};

/** Synced Life-of-Jesus plates (Desktop export); tier 7+8 share plate _7 (final week + post-resurrection on one sheet). */
const LOJ_FILE: Record<number, string> = {
  1: "1776216610758-0209927a-e698-4e7d-91c8-f6f21b9e43b3_1.jpg",
  2: "1776216610758-0209927a-e698-4e7d-91c8-f6f21b9e43b3_2.jpg",
  3: "1776216610758-0209927a-e698-4e7d-91c8-f6f21b9e43b3_3.jpg",
  4: "1776216610758-0209927a-e698-4e7d-91c8-f6f21b9e43b3_4.jpg",
  5: "1776216610758-0209927a-e698-4e7d-91c8-f6f21b9e43b3_5.jpg",
  6: "1776216610758-0209927a-e698-4e7d-91c8-f6f21b9e43b3_6.jpg",
  7: "1776216610758-0209927a-e698-4e7d-91c8-f6f21b9e43b3_7.jpg",
  8: "1776216610758-0209927a-e698-4e7d-91c8-f6f21b9e43b3_7.jpg",
};

const LOJ_TITLE: Record<number, string> = {
  1: "LOJ-1 · Birth to adulthood",
  2: "LOJ-2 · Ministry begins",
  3: "LOJ-3 · Early ministry",
  4: "LOJ-4 · Galilean ministry",
  5: "LOJ-5 · Gentile ministry",
  6: "LOJ-6 · Heading south",
  7: "LOJ-7 · Final week",
  8: "LOJ-8 · Post-resurrection",
};

const LOJ_REF: Record<number, string> = {
  1: "Matt 1–2; Luke 1–2",
  2: "Matt 3–4; Mark 1; Luke 3–5; John 1–2",
  3: "Matt 5–13; Mark 2–4; Luke 6–8; John 3–4",
  4: "Matt 8–14; Mark 4–6; Luke 8–9; John 6",
  5: "Matt 15–17; Mark 7–9; Luke 9",
  6: "Matt 19–21; Mark 10–11; Luke 9:51–19; John 10–12",
  7: "Matt 21–27; Mark 11–15; Luke 19–23; John 12–19",
  8: "Matt 28; Mark 16; Luke 24; John 20–21; Acts 1",
};

type LojRule = { tier: number; lo: number; hi: number };

const LOJ_MATT: LojRule[] = [
  { tier: 1, lo: 1, hi: 2 },
  { tier: 2, lo: 3, hi: 4 },
  { tier: 3, lo: 5, hi: 13 },
  { tier: 4, lo: 8, hi: 14 },
  { tier: 5, lo: 15, hi: 18 },
  { tier: 6, lo: 18, hi: 21 },
  { tier: 7, lo: 21, hi: 27 },
  { tier: 8, lo: 28, hi: 28 },
];

const LOJ_MARK: LojRule[] = [
  { tier: 2, lo: 1, hi: 1 },
  { tier: 3, lo: 2, hi: 4 },
  { tier: 4, lo: 4, hi: 6 },
  { tier: 5, lo: 7, hi: 9 },
  { tier: 6, lo: 10, hi: 11 },
  { tier: 7, lo: 11, hi: 15 },
  { tier: 8, lo: 16, hi: 16 },
];

const LOJ_LUKE: LojRule[] = [
  { tier: 1, lo: 1, hi: 2 },
  { tier: 2, lo: 3, hi: 5 },
  { tier: 3, lo: 6, hi: 8 },
  { tier: 4, lo: 8, hi: 9 },
  { tier: 5, lo: 9, hi: 9 },
  { tier: 6, lo: 9, hi: 19 },
  { tier: 7, lo: 19, hi: 23 },
  { tier: 8, lo: 24, hi: 24 },
];

const LOJ_JOHN: LojRule[] = [
  { tier: 2, lo: 1, hi: 2 },
  { tier: 3, lo: 3, hi: 4 },
  { tier: 4, lo: 6, hi: 6 },
  { tier: 6, lo: 10, hi: 12 },
  { tier: 7, lo: 12, hi: 19 },
  { tier: 8, lo: 20, hi: 21 },
];

function tiersFromRules(rules: LojRule[], chapter: number): number[] {
  const t = rules.filter((r) => chapter >= r.lo && chapter <= r.hi).map((r) => r.tier);
  return [...new Set(t)].sort((a, b) => a - b);
}

function primaryTier(tiers: number[]): number {
  if (!tiers.length) return 1;
  return Math.max(...tiers);
}

export function lojTiersMatchingChapter(book: string, chapter: number, verse?: number): number[] {
  const b = book.trim();
  const ch = Math.max(1, chapter);
  if (!["Matthew", "Mark", "Luke", "John"].includes(b)) return [];

  let tiers: number[];
  if (b === "Matthew") tiers = tiersFromRules(LOJ_MATT, ch);
  else if (b === "Mark") tiers = tiersFromRules(LOJ_MARK, ch);
  else if (b === "Luke") {
    tiers = tiersFromRules(LOJ_LUKE, ch);
    if (ch === 9) {
      const v = verse ?? 1;
      if (v < 51) tiers = tiers.filter((t) => t !== 6);
    }
  } else tiers = tiersFromRules(LOJ_JOHN, ch);

  const out = [...new Set(tiers)].sort((a, b) => a - b);
  if (out.length) return out;
  if (b !== "John") return out;

  if (ch >= 20) return [8];
  if (ch >= 12) return [7];
  if (ch >= 10) return [6];
  if (ch >= 6) return [4];
  if (ch >= 3) return [3];
  return [2];
}

function resultForPlate(plate: number, reference: string): PassageMapResult {
  const p = PLATE_CATALOG_ID[plate] ? plate : 5;
  const file = PLATE_FILE[p] ?? PLATE_FILE[5]!;
  return {
    catalogId: PLATE_CATALOG_ID[p] ?? "ws-05-the-land-of-canaan",
    src: `${WS}/${file}`,
    title: PLATE_TITLE[p] ?? file.replace(/\.png$/i, ""),
    reference,
    set: "A",
  };
}

function resultForLoj(tier: number): PassageMapResult {
  const t = LOJ_CATALOG_ID[tier] ? tier : 1;
  const file = LOJ_FILE[t] ?? LOJ_FILE[1]!;
  return {
    catalogId: LOJ_CATALOG_ID[t] ?? "ws-loj-1-birth-to-adulthood",
    src: `${WS}/${file}`,
    title: LOJ_TITLE[t] ?? `LOJ-${t}`,
    reference: LOJ_REF[t] ?? "",
    set: "B",
  };
}

const PRE_EXILE_PROPHETS = new Set([
  "Isaiah",
  "Hosea",
  "Amos",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Jonah",
]);
const EXILE_PROPHETS = new Set(["Jeremiah", "Ezekiel", "Lamentations", "Obadiah"]);
const POST_EXILE_PROPHETS = new Set(["Haggai", "Zechariah", "Malachi", "Joel"]);
const WISDOM_P = new Set(["Psalms", "Proverbs", "Job", "Song of Solomon"]);
const NT_EPISTLES = new Set([
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
]);

const BOOK_DEFAULT_PLATE: Record<string, number> = {
  Genesis: 3,
  Exodus: 8,
  Leviticus: 8,
  Numbers: 8,
  Deuteronomy: 9,
  Joshua: 13,
  Judges: 15,
  Ruth: 15,
  "1 Samuel": 16,
  "2 Samuel": 18,
  "1 Kings": 19,
  "2 Kings": 21,
  "1 Chronicles": 14,
  "2 Chronicles": 21,
  Ezra: 27,
  Nehemiah: 27,
  Esther: 26,
  Job: 18,
  Psalms: 18,
  Proverbs: 18,
  Ecclesiastes: 19,
  "Song of Solomon": 18,
  Isaiah: 21,
  Jeremiah: 24,
  Lamentations: 24,
  Ezekiel: 24,
  Daniel: 30,
  Hosea: 21,
  Joel: 27,
  Amos: 21,
  Obadiah: 24,
  Jonah: 21,
  Micah: 21,
  Nahum: 22,
  Habakkuk: 22,
  Zephaniah: 22,
  Haggai: 27,
  Zechariah: 27,
  Malachi: 27,
  Matthew: 36,
  Mark: 36,
  Luke: 36,
  John: 36,
  Acts: 38,
  Romans: 38,
  "1 Corinthians": 38,
  "2 Corinthians": 38,
  Galatians: 38,
  Ephesians: 38,
  Philippians: 38,
  Colossians: 38,
  "1 Thessalonians": 38,
  "2 Thessalonians": 38,
  "1 Timothy": 38,
  "2 Timothy": 42,
  Titus: 38,
  Philemon: 42,
  Hebrews: 38,
  James: 36,
  "1 Peter": 38,
  "2 Peter": 38,
  "1 John": 36,
  "2 John": 36,
  "3 John": 36,
  Jude: 38,
  Revelation: 43,
};

function knowingBiblePlate(book: string, chapter: number): number {
  const b = book.trim();
  if (b === "Genesis") {
    if (chapter === 10) return 2;
    if (chapter <= 11) return 1;
    return 3;
  }
  if (b === "Exodus") return chapter >= 12 ? 8 : 3;
  if (b === "Numbers") {
    if (chapter === 34) return 9;
    if (chapter === 21) return 11;
    return 8;
  }
  if (b === "Joshua") {
    if (chapter === 1) return 10;
    if (chapter >= 6 && chapter <= 12) return 13;
    if (chapter >= 13 && chapter <= 21) return 14;
    return 13;
  }
  if (b === "Deuteronomy" && chapter >= 12) return 8;
  if (b === "Ruth" || b === "Judges") return 15;
  if (b === "1 Samuel") return chapter >= 10 ? 16 : 15;
  if (b === "2 Samuel") return chapter >= 5 ? 18 : 17;
  if (b === "1 Kings") {
    if (chapter === 4) return 20;
    if (chapter <= 11) return 19;
    return 21;
  }
  if (b === "2 Kings") {
    if (chapter >= 24) return 24;
    if (chapter >= 15 && chapter <= 17) return 22;
    return 21;
  }
  if (b === "Daniel") {
    if (chapter === 5 || chapter === 6) return 25;
    if (chapter === 8) return 28;
    if (chapter === 11) return 30;
    if (chapter === 2 || chapter === 7) return 32;
    return 30;
  }
  if (b === "Acts") {
    if (chapter <= 12) return 37;
    if (chapter <= 14) return 39;
    if (chapter <= 18) return 40;
    if (chapter <= 21) return 41;
    if (chapter >= 27) return 42;
    return 38;
  }
  if (b === "Revelation") return 43;

  const d = BOOK_DEFAULT_PLATE[b];
  if (d !== undefined) return d;
  if (WISDOM_P.has(b)) return 18;
  if (PRE_EXILE_PROPHETS.has(b)) return 21;
  if (EXILE_PROPHETS.has(b)) return 24;
  if (POST_EXILE_PROPHETS.has(b)) return 27;
  if (NT_EPISTLES.has(b)) return 38;
  return 5;
}

function referenceFor(book: string, chapter: number, verse?: number): string {
  if (verse != null && Number.isFinite(verse)) return `${book} ${chapter}:${verse}`;
  return `${book} ${chapter}`;
}

export function mapForPassage(book: string, chapter: number, verse?: number): PassageMapResult {
  const ch = Math.max(1, chapter);
  const b = book.trim();
  const ref = referenceFor(b, ch, verse);

  if (["Matthew", "Mark", "Luke", "John"].includes(b)) {
    const tiers = lojTiersMatchingChapter(b, ch, verse);
    const primary = primaryTier(tiers.length ? tiers : [1]);
    return resultForLoj(primary);
  }

  return resultForPlate(knowingBiblePlate(b, ch), ref);
}

export function mapsForPassageRotation(book: string, chapter: number, verse?: number): PassageMapResult[] {
  const ch = Math.max(1, chapter);
  const b = book.trim();
  const ref = referenceFor(b, ch, verse);

  if (["Matthew", "Mark", "Luke", "John"].includes(b)) {
    const tiers = lojTiersMatchingChapter(b, ch, verse);
    if (!tiers.length) return [resultForLoj(1)];
    const primary = primaryTier(tiers);
    const rest = tiers.filter((t) => t !== primary).sort((a, b) => b - a);
    const ordered = [primary, ...rest].map((t) => resultForLoj(t));
    const seenSrc = new Set<string>();
    return ordered.filter((r) => {
      if (seenSrc.has(r.src)) return false;
      seenSrc.add(r.src);
      return true;
    });
  }

  return [resultForPlate(knowingBiblePlate(b, ch), ref)];
}
