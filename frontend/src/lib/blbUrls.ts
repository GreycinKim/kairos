/** Blue Letter Bible URL helpers (client-side; mirrors backend `blb_links.py`). */

const BLB_BOOK: Record<string, string> = {
  Genesis: "gen",
  Exodus: "exo",
  Leviticus: "lev",
  Numbers: "num",
  Deuteronomy: "deu",
  Joshua: "jos",
  Judges: "jdg",
  Ruth: "rut",
  "1 Samuel": "1sa",
  "2 Samuel": "2sa",
  "1 Kings": "1ki",
  "2 Kings": "2ki",
  "1 Chronicles": "1ch",
  "2 Chronicles": "2ch",
  Ezra: "ezr",
  Nehemiah: "neh",
  Esther: "est",
  Job: "job",
  Psalms: "psa",
  Proverbs: "pro",
  Ecclesiastes: "ecc",
  "Song of Solomon": "sng",
  Isaiah: "isa",
  Jeremiah: "jer",
  Lamentations: "lam",
  Ezekiel: "ezk",
  Daniel: "dan",
  Hosea: "hos",
  Joel: "jol",
  Amos: "amo",
  Obadiah: "oba",
  Jonah: "jon",
  Micah: "mic",
  Nahum: "nah",
  Habakkuk: "hab",
  Zephaniah: "zep",
  Haggai: "hag",
  Zechariah: "zec",
  Malachi: "mal",
  Matthew: "mat",
  Mark: "mrk",
  Luke: "luk",
  John: "jhn",
  Acts: "act",
  Romans: "rom",
  "1 Corinthians": "1co",
  "2 Corinthians": "2co",
  Galatians: "gal",
  Ephesians: "eph",
  Philippians: "php",
  Colossians: "col",
  "1 Thessalonians": "1th",
  "2 Thessalonians": "2th",
  "1 Timothy": "1ti",
  "2 Timothy": "2ti",
  Titus: "tit",
  Philemon: "phm",
  Hebrews: "heb",
  James: "jas",
  "1 Peter": "1pe",
  "2 Peter": "2pe",
  "1 John": "1jn",
  "2 John": "2jn",
  "3 John": "3jn",
  Jude: "jud",
  Revelation: "rev",
};

const BLB_TRANSLATION: Record<string, string> = {
  ESV: "esv",
  KJV: "kjv",
  NKJV: "nkjv",
  LSB: "lsb",
};

export function blbBookAbbrev(book: string): string | null {
  return BLB_BOOK[book] ?? null;
}

export function blbTranslationSlug(translation: string): string {
  return BLB_TRANSLATION[translation.toUpperCase()] ?? "esv";
}

export function blbInterlinearUrl(book: string, chapter: number, verse: number, translation: string): string | null {
  const b = blbBookAbbrev(book);
  if (!b) return null;
  const t = blbTranslationSlug(translation);
  return `https://www.blueletterbible.org/${t}/${b}/${chapter}/${verse}/`;
}

export function blbSearchUrl(word: string): string {
  return `https://www.blueletterbible.org/search/search?q=${encodeURIComponent(word.trim())}`;
}

export function blbLexiconHubUrl(): string {
  return "https://www.blueletterbible.org/study/lexicon/";
}

export function blbConcordanceUrl(): string {
  return "https://www.blueletterbible.org/search/concordance.cfm";
}
