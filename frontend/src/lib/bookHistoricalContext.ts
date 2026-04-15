/**
 * Approximate historical setting for each biblical book, aligned with the
 * geography map era slider (indices 0–7; 8 = all eras on the map).
 */
export const MAP_ERA_LABELS: { index: number; id: string; short: string }[] = [
  { index: 0, id: "patriarchs", short: "Patriarchs" },
  { index: 1, id: "exodus-conquest", short: "Exodus & conquest" },
  { index: 2, id: "united-kingdom", short: "United monarchy" },
  { index: 3, id: "divided-kingdom", short: "Israel & Judah" },
  { index: 4, id: "exile-return", short: "Exile & return" },
  { index: 5, id: "second-temple", short: "Second Temple" },
  { index: 6, id: "jesus-ministry", short: "Jesus' ministry" },
  { index: 7, id: "early-church", short: "Early church" },
];

export type BookHistoricalContext = {
  /** Human-readable date band (approximate; interpretive). */
  approximateRange: string;
  /** Default map era slider index 0–7 for this book. */
  suggestedMapEraIndex: number;
  /** One or two sentences for the side panel. */
  summary: string;
  /** Empire / political frame (optional). */
  worldStage?: string;
};

const B: Record<string, BookHistoricalContext> = {
  Genesis: {
    approximateRange: "Traditionally c. 2000–1500 BC (narrative spans earlier)",
    suggestedMapEraIndex: 0,
    worldStage: "Family patriarchs; Egyptian Middle Kingdom / Hyksos backdrop in later chapters.",
    summary:
      "Genesis moves from Mesopotamia and Haran into Canaan and Egypt. Treat locations as narrative settings rather than precise archaeology.",
  },
  Exodus: {
    approximateRange: "Commonly placed c. 13th–12th century BC in many reconstructions",
    suggestedMapEraIndex: 1,
    worldStage: "New Kingdom Egypt; Sinai and Transjordan corridors toward Canaan.",
    summary: "The story centers on Egypt, the sea crossing, and approach to the promised land—ideal for the Exodus & conquest map layer.",
  },
  Leviticus: {
    approximateRange: "Narrative setting at Sinai; c. 13th century BC in traditional chronology",
    suggestedMapEraIndex: 1,
    summary: "Legal material framed at Sinai; geography is camp and wilderness more than borders.",
  },
  Numbers: {
    approximateRange: "Wilderness generation; c. 13th–12th century BC (traditional)",
    suggestedMapEraIndex: 1,
    summary: "Itineraries from Sinai toward Moab and the Jordan—use the Exodus / conquest era on the map.",
  },
  Deuteronomy: {
    approximateRange: "Moses' speeches east of the Jordan; same narrative horizon as Joshua",
    suggestedMapEraIndex: 1,
    summary: "Speeches on the plains of Moab facing Canaan; pairs with the conquest account.",
  },
  Joshua: {
    approximateRange: "Late Bronze / early Iron Age transition (debated)",
    suggestedMapEraIndex: 1,
    worldStage: "Canaanite city-states; emerging Israel in the highlands.",
    summary: "Tribal allotments and central highlands—match the United Kingdom layer for schematic tribal blocks, or Exodus era for the campaign.",
  },
  Judges: {
    approximateRange: "Iron I–IIa; c. 12th–11th century BC (broadly)",
    suggestedMapEraIndex: 2,
    worldStage: "Fragmented tribes; Philistine pentapolis and neighbors.",
    summary: "Deborah, Gideon, Samson—think hill country, Jezreel, and coastal plain friction.",
  },
  Ruth: {
    approximateRange: "Narrative set in the judges period; Bethlehem and Moab",
    suggestedMapEraIndex: 2,
    summary: "Moabite sojourn and return to Bethlehem—small geography, judges-era backdrop.",
  },
  "1 Samuel": {
    approximateRange: "Late judges into early monarchy; c. 11th–10th century BC",
    suggestedMapEraIndex: 2,
    summary: "Shiloh, Gibeah, and the rise of kingship—United Kingdom map era fits many scenes.",
  },
  "2 Samuel": {
    approximateRange: "United monarchy; David's reign",
    suggestedMapEraIndex: 2,
    summary: "Hebron, Jerusalem, and empire-building wars—core united-kingdom geography.",
  },
  "1 Kings": {
    approximateRange: "Solomon through divided kingdom; c. 10th–9th century BC",
    suggestedMapEraIndex: 3,
    summary: "Temple building in Jerusalem, then fracture—slide toward Divided Kingdom for Ahab and Elijah.",
  },
  "2 Kings": {
    approximateRange: "Divided kingdoms through exile; c. 9th–6th century BC",
    suggestedMapEraIndex: 3,
    worldStage: "Neo-Assyrian and Neo-Babylonian pressure.",
    summary: "Samaria's fall and Judah's Babylonian exile—Israel vs Judah layers help visualize the story.",
  },
  "1 Chronicles": {
    approximateRange: "Genealogies span Adam to exile; narrative focus on David",
    suggestedMapEraIndex: 2,
    summary: "Retells united-kingdom high points from a post-exilic perspective; map eras vary by chapter.",
  },
  "2 Chronicles": {
    approximateRange: "Solomon through exile; theological history of Judah",
    suggestedMapEraIndex: 3,
    summary: "Temple, reformers, and fall to Babylon—Divided Kingdom and Exile & return layers.",
  },
  Ezra: {
    approximateRange: "Persian period; late 6th–5th century BC",
    suggestedMapEraIndex: 4,
    worldStage: "Achaemenid Persia; province of Yehud.",
    summary: "Return from Babylon and rebuilding—Exile & return / Second Temple boundary on the map.",
  },
  Nehemiah: {
    approximateRange: "Persian period; mid-5th century BC",
    suggestedMapEraIndex: 4,
    summary: "Jerusalem's walls and Persian administration—same era band as Ezra.",
  },
  Esther: {
    approximateRange: "Persian imperial period; c. 5th century BC",
    suggestedMapEraIndex: 4,
    worldStage: "Achaemenid capitals Susa and Persepolis (off-map east); Jewish diaspora.",
    summary: "Court intrigue in Susa; geography is imperial Persia more than the land.",
  },
  Job: {
    approximateRange: "Setting debated; often read as patriarchal or monarchic poetry",
    suggestedMapEraIndex: 0,
    summary: "Land of Uz (unknown site)—use as literary wisdom; map is secondary.",
  },
  Psalms: {
    approximateRange: "Composed across monarchy, exile, and return",
    suggestedMapEraIndex: 2,
    summary: "Many psalms assume Jerusalem and Zion; era depends on which psalms you read—start with United monarchy.",
  },
  Proverbs: {
    approximateRange: "Solomonic frame; wisdom from monarchy and later",
    suggestedMapEraIndex: 2,
    summary: "Often tied to Solomon's court; practical wisdom rooted in Jerusalem.",
  },
  Ecclesiastes: {
    approximateRange: "Traditionally Solomonic; many date to Persian or Hellenistic periods",
    suggestedMapEraIndex: 5,
    summary: "Qoheleth in Jerusalem under empires—Second Temple era is a reasonable map default.",
  },
  "Song of Solomon": {
    approximateRange: "Often linked to Solomon's age (literary)",
    suggestedMapEraIndex: 2,
    summary: "Poetry of Israel and the wilderness—little political geography.",
  },
  Isaiah: {
    approximateRange: "8th century BC (Isaiah of Jerusalem) plus later exilic additions",
    suggestedMapEraIndex: 3,
    summary: "Assyrian crisis and hope for return—slide from Divided Kingdom toward Exile & return for later chapters.",
  },
  Jeremiah: {
    approximateRange: "Late 7th–early 6th century BC",
    suggestedMapEraIndex: 3,
    worldStage: "End of Judah; Babylonian advance.",
    summary: "Jerusalem, Anathoth, Egypt—map the final years of Judah and exile.",
  },
  Lamentations: {
    approximateRange: "After 586 BC",
    suggestedMapEraIndex: 4,
    summary: "Mourning destroyed Jerusalem—Exile & return emotional center.",
  },
  Ezekiel: {
    approximateRange: "Exile in Babylon; c. 6th century BC",
    suggestedMapEraIndex: 4,
    worldStage: "Judahite exiles by the Chebar canal; visions of restored temple.",
    summary: "Babylon and visionary Jerusalem—Exile & return era.",
  },
  Daniel: {
    approximateRange: "Exile to Persian rule; visions extend symbolically later",
    suggestedMapEraIndex: 4,
    worldStage: "Babylon, Medes and Persians in court tales.",
    summary: "Imperial centers east of the map; Judea under Persian rule for the return horizon.",
  },
  Hosea: {
    approximateRange: "8th century BC (northern kingdom)",
    suggestedMapEraIndex: 3,
    summary: "Ephraim / Samaria—Divided Kingdom layer.",
  },
  Joel: {
    approximateRange: "Often dated postexilic; debated",
    suggestedMapEraIndex: 5,
    summary: "Judah and the day of the Lord—Second Temple default is reasonable.",
  },
  Amos: {
    approximateRange: "Mid-8th century BC",
    suggestedMapEraIndex: 3,
    summary: "Tekoa to Bethel—Assyrian-era northern kingdom.",
  },
  Obadiah: {
    approximateRange: "Edom and the nations; often linked to exile period",
    suggestedMapEraIndex: 4,
    summary: "Short oracle against Edom (Negev / Transjordan).",
  },
  Jonah: {
    approximateRange: "8th century setting (Assyrian Nineveh)",
    suggestedMapEraIndex: 3,
    worldStage: "Assyrian capital Nineveh (upper Mesopotamia).",
    summary: "Joppa, storm at sea, Nineveh—mostly off the Levant map but Joppa is coastal.",
  },
  Micah: {
    approximateRange: "Late 8th century BC (Judah)",
    suggestedMapEraIndex: 3,
    summary: "Moresheth to Jerusalem—Assyrian crisis in Judah.",
  },
  Nahum: {
    approximateRange: "7th century BC fall of Nineveh",
    suggestedMapEraIndex: 3,
    worldStage: "Neo-Assyrian collapse.",
    summary: "Nineveh's doom—Assyrian heartland beyond the default map window.",
  },
  Habakkuk: {
    approximateRange: "Late 7th century BC (rising Babylon)",
    suggestedMapEraIndex: 3,
    summary: "Judah watching Babylon—transition to exile era.",
  },
  Zephaniah: {
    approximateRange: "Late 7th century BC (Josiah's Judah)",
    suggestedMapEraIndex: 3,
    summary: "Day of the Lord against Judah and nations.",
  },
  Haggai: {
    approximateRange: "520 BC (Persian Yehud)",
    suggestedMapEraIndex: 4,
    summary: "Postexilic temple rebuilding—Exile & return / Second Temple.",
  },
  Zechariah: {
    approximateRange: "Late 6th century BC",
    suggestedMapEraIndex: 4,
    summary: "Jerusalem restoration visions alongside Haggai.",
  },
  Malachi: {
    approximateRange: "5th century BC Persian period",
    suggestedMapEraIndex: 5,
    summary: "Second Temple community disputes—Second Temple map layer.",
  },
  Matthew: {
    approximateRange: "c. AD 27–30 (ministry of Jesus)",
    suggestedMapEraIndex: 6,
    worldStage: "Roman Judea under prefects; Herodian client kingdoms.",
    summary: "Galilee, Decapolis, Jerusalem—Jesus' ministry layer on the map.",
  },
  Mark: {
    approximateRange: "c. AD 27–30",
    suggestedMapEraIndex: 6,
    summary: "Fast Galilean ministry toward Jerusalem—same layer as Matthew.",
  },
  Luke: {
    approximateRange: "c. AD 27–33 with Acts continuation",
    suggestedMapEraIndex: 6,
    summary: "Travel narrative and Jerusalem focus; Acts continues into the church era.",
  },
  John: {
    approximateRange: "c. AD 27–33",
    suggestedMapEraIndex: 6,
    summary: "Samaria, Galilee, Jerusalem feasts—ministry era.",
  },
  Acts: {
    approximateRange: "c. AD 30–62 (narrative span)",
    suggestedMapEraIndex: 7,
    worldStage: "Roman eastern Mediterranean; Jerusalem to Rome.",
    summary: "Jerusalem church, Pauline missions, shipwreck to Rome—Early church / Roman provinces.",
  },
  Romans: {
    approximateRange: "Written c. AD 57 from Corinth (traditional)",
    suggestedMapEraIndex: 7,
    worldStage: "Imperial city Rome; Pauline mission field.",
    summary: "Letter theology; map shows Paul's world more than the letter's arguments.",
  },
  "1 Corinthians": {
    approximateRange: "c. AD 53–55",
    suggestedMapEraIndex: 7,
    summary: "Urban Corinth in Achaia—early church in a Roman colony.",
  },
  "2 Corinthians": {
    approximateRange: "c. AD 55–56",
    suggestedMapEraIndex: 7,
    summary: "Paul's travels in Macedonia and Achaia.",
  },
  Galatians: {
    approximateRange: "c. AD 48–55 (depending on north/south theory)",
    suggestedMapEraIndex: 7,
    summary: "Roman Galatia / southern churches—Anatolian plateau.",
  },
  Ephesians: {
    approximateRange: "Traditionally Roman imprisonment c. AD 60s",
    suggestedMapEraIndex: 7,
    summary: "Ephesus as hub of Paul's Asia ministry.",
  },
  Philippians: {
    approximateRange: "c. AD 60–62 from Rome or Ephesus (debated)",
    suggestedMapEraIndex: 7,
    summary: "Philippi in Macedonia—Via Egnatia city.",
  },
  Colossians: {
    approximateRange: "c. AD 60s",
    suggestedMapEraIndex: 7,
    summary: "Colossae / Laodicea in the Lycus valley (Asia).",
  },
  "1 Thessalonians": {
    approximateRange: "c. AD 50",
    suggestedMapEraIndex: 7,
    summary: "Thessalonica in Macedonia.",
  },
  "2 Thessalonians": {
    approximateRange: "Soon after 1 Thessalonians",
    suggestedMapEraIndex: 7,
    summary: "Same Macedonian church context.",
  },
  "1 Timothy": {
    approximateRange: "Pastoral letters; late Pauline tradition",
    suggestedMapEraIndex: 7,
    summary: "Ephesus and Crete in the Pastorals' setting.",
  },
  "2 Timothy": {
    approximateRange: "Paul's final imprisonment (traditional)",
    suggestedMapEraIndex: 7,
    summary: "Rome or journey scenes—early church Mediterranean.",
  },
  Titus: {
    approximateRange: "Pastoral period",
    suggestedMapEraIndex: 7,
    summary: "Crete in the Pastorals.",
  },
  Philemon: {
    approximateRange: "Pauline imprisonment letter",
    suggestedMapEraIndex: 7,
    summary: "Colossae household—Asia Minor.",
  },
  Hebrews: {
    approximateRange: "Before AD 70 in many readings; author unknown",
    suggestedMapEraIndex: 5,
    summary: "Temple symbolism and diaspora encouragement—Second Temple Judaism.",
  },
  James: {
    approximateRange: "Late first century (broadly)",
    suggestedMapEraIndex: 7,
    summary: "Diaspora letter; scattered Jewish believers.",
  },
  "1 Peter": {
    approximateRange: "c. AD 60s",
    suggestedMapEraIndex: 7,
    summary: "Asia Minor provinces: Pontus, Galatia, Cappadocia, Asia, Bithynia.",
  },
  "2 Peter": {
    approximateRange: "Often dated late first century",
    suggestedMapEraIndex: 7,
    summary: "Shared Petrine tradition; little concrete geography.",
  },
  "1 John": {
    approximateRange: "Late first century Ephesus (tradition)",
    suggestedMapEraIndex: 7,
    summary: "Johannine community in Asia.",
  },
  "2 John": {
    approximateRange: "Late first century",
    suggestedMapEraIndex: 7,
    summary: "Short letter; Asia Minor context.",
  },
  "3 John": {
    approximateRange: "Late first century",
    suggestedMapEraIndex: 7,
    summary: "Hospitality travels between house churches.",
  },
  Jude: {
    approximateRange: "Late first century",
    suggestedMapEraIndex: 7,
    summary: "Contested teachers; general early church setting.",
  },
  Revelation: {
    approximateRange: "Often dated Domitianic c. AD 90–95 (traditional) or earlier",
    suggestedMapEraIndex: 7,
    worldStage: "Seven churches of Roman Asia; Patmos.",
    summary: "Ephesus to Laodicea on the map; apocalyptic imagery beyond literal terrain.",
  },
};

export function getBookHistoricalContext(book: string): BookHistoricalContext | null {
  return B[book] ?? null;
}

export function defaultEraIndexForBook(book: string): number {
  const ctx = getBookHistoricalContext(book);
  if (!ctx) return 8;
  return Math.min(8, Math.max(0, ctx.suggestedMapEraIndex));
}
