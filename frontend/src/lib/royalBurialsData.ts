export type RoyalKingdom = "judah" | "israel" | "unified" | "mixed" | "unknown";
export type BurialCircumstance = "honored" | "standard" | "dishonored" | "violent" | "exile";

export type RoyalBurialKing = {
  name: string;
  kingdom: RoyalKingdom;
  tomb: string;
  burialLocation: string;
  reference: string;
  notes: string;
  circumstance: BurialCircumstance;
  reignApprox?: string;
};

export type RoyalBurialSite = {
  key: string;
  name: string;
  location: string;
  group: "judah" | "israel" | "mixed" | "unknown";
  description: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
};

export const ROYAL_BURIAL_SITES: RoyalBurialSite[] = [
  {
    key: "city-of-david-kings",
    name: "Tomb of the Kings - City of David",
    location: "Jerusalem",
    group: "judah",
    description: "Primary royal burial complex for Davidic dynasty kings.",
    lat: 31.778,
    lng: 35.235,
    mapX: 56,
    mapY: 57,
  },
  {
    key: "city-of-david-excluded",
    name: "City of David - Excluded from Royal Tombs",
    location: "Jerusalem",
    group: "judah",
    description: "Burials in Jerusalem but withheld from honored royal tombs.",
    lat: 31.774,
    lng: 35.233,
    mapX: 54,
    mapY: 59,
  },
  {
    key: "garden-of-uzza",
    name: "Garden of Uzza (Palace Garden)",
    location: "Jerusalem",
    group: "judah",
    description: "Palace-garden burial site for Manasseh and Amon.",
    lat: 31.781,
    lng: 35.239,
    mapX: 58,
    mapY: 55,
  },
  {
    key: "samaria-royal",
    name: "Samaria - Royal Tombs of Israel",
    location: "Samaria",
    group: "israel",
    description: "Northern kingdom royal burial place in the capital region.",
    lat: 32.276,
    lng: 35.195,
    mapX: 44,
    mapY: 48,
  },
  {
    key: "tirzah",
    name: "Tirzah",
    location: "Tirzah",
    group: "israel",
    description: "Early northern capital where Baasha was buried.",
    lat: 32.267,
    lng: 35.323,
    mapX: 45,
    mapY: 45,
  },
  {
    key: "jezreel-naboth",
    name: "Jezreel - Naboth's Field",
    location: "Jezreel Valley",
    group: "israel",
    description: "Joram's body was cast in Naboth's field after judgment.",
    lat: 32.559,
    lng: 35.324,
    mapX: 40,
    mapY: 43,
  },
  {
    key: "josiah-own-tomb",
    name: "Josiah's Own Tomb - Jerusalem",
    location: "Jerusalem",
    group: "judah",
    description: "Distinct mention of Josiah's own tomb in Jerusalem.",
    lat: 31.777,
    lng: 35.238,
    mapX: 57,
    mapY: 61,
  },
  {
    key: "ahaz-excluded",
    name: "Ahaz's Tomb - Jerusalem (excluded from kings' tombs)",
    location: "Jerusalem",
    group: "judah",
    description: "Ahaz buried in city but excluded from kings' tombs.",
    lat: 31.775,
    lng: 35.229,
    mapX: 52,
    mapY: 60,
  },
  {
    key: "uzziah-field",
    name: "Uzziah's Field - Near but not in the Royal Tombs",
    location: "Near Jerusalem",
    group: "judah",
    description: "Separated burial area because of his leprosy condition.",
    lat: 31.818,
    lng: 35.266,
    mapX: 60,
    mapY: 58,
  },
  {
    key: "egypt-captivity",
    name: "Egypt (died in captivity)",
    location: "Egypt",
    group: "unknown",
    description: "Captivity death, outside homeland burial tradition.",
    lat: 30.044,
    lng: 31.236,
    mapX: 21,
    mapY: 74,
  },
  {
    key: "babylon-unknown",
    name: "Babylon / Unknown (captivity or no record)",
    location: "Babylon / Unknown",
    group: "unknown",
    description: "Exile, dishonor, or no explicit burial record.",
    lat: 32.536,
    lng: 44.420,
    mapX: 83,
    mapY: 33,
  },
  {
    key: "not-recorded-violent",
    name: "Not recorded / violent death",
    location: "Various",
    group: "mixed",
    description: "Deaths in coups or violence with no stable tomb tradition.",
    lat: 32.050,
    lng: 35.300,
    mapX: 47,
    mapY: 39,
  },
];

export const ROYAL_BURIAL_KINGS: RoyalBurialKing[] = [
  { name: "Saul (bones reburied)", kingdom: "unified", tomb: "city-of-david-kings", burialLocation: "City of David", reference: "2 Sam 21:12-14", notes: "Bones gathered and reburied with honor later.", circumstance: "honored", reignApprox: "~1050-1010 BC" },
  { name: "David", kingdom: "unified", tomb: "city-of-david-kings", burialLocation: "City of David", reference: "1 Kgs 2:10", notes: "Buried in the city he established as capital.", circumstance: "honored", reignApprox: "~1010-970 BC" },
  { name: "Solomon", kingdom: "unified", tomb: "city-of-david-kings", burialLocation: "City of David", reference: "1 Kgs 11:43", notes: "Royal succession continued through Davidic tomb tradition.", circumstance: "standard", reignApprox: "~970-931 BC" },
  { name: "Rehoboam", kingdom: "judah", tomb: "city-of-david-kings", burialLocation: "City of David", reference: "1 Kgs 14:31", notes: "Buried with his fathers in David's city.", circumstance: "standard", reignApprox: "~931-913 BC" },
  { name: "Abijah", kingdom: "judah", tomb: "city-of-david-kings", burialLocation: "City of David", reference: "1 Kgs 15:8", notes: "Continues expected Judah burial pattern.", circumstance: "standard", reignApprox: "~913-911 BC" },
  { name: "Asa", kingdom: "judah", tomb: "city-of-david-kings", burialLocation: "City of David", reference: "2 Chr 16:14", notes: "Great honor and spices prepared at burial.", circumstance: "honored", reignApprox: "~911-870 BC" },
  { name: "Jehoshaphat", kingdom: "judah", tomb: "city-of-david-kings", burialLocation: "City of David", reference: "1 Kgs 22:50", notes: "Buried in royal line with fathers.", circumstance: "standard", reignApprox: "~870-848 BC" },
  { name: "Ahaziah of Judah", kingdom: "judah", tomb: "city-of-david-kings", burialLocation: "City of David", reference: "2 Chr 22:9", notes: "Granted burial due to Jehoshaphat's legacy.", circumstance: "standard", reignApprox: "~841 BC" },
  { name: "Jotham", kingdom: "judah", tomb: "city-of-david-kings", burialLocation: "City of David", reference: "2 Kgs 15:38", notes: "Buried in the city of David.", circumstance: "standard", reignApprox: "~750-735 BC" },
  { name: "Hezekiah", kingdom: "judah", tomb: "city-of-david-kings", burialLocation: "City of David ascent", reference: "2 Chr 32:33", notes: "Buried with special honor among Judah leaders.", circumstance: "honored", reignApprox: "~715-686 BC" },
  { name: "Jehoram of Judah", kingdom: "judah", tomb: "city-of-david-excluded", burialLocation: "Jerusalem", reference: "2 Chr 21:20", notes: "Dishonored; not buried in kings' tombs.", circumstance: "dishonored", reignApprox: "~848-841 BC" },
  { name: "Joash of Judah", kingdom: "judah", tomb: "city-of-david-excluded", burialLocation: "Jerusalem", reference: "2 Chr 24:25", notes: "Murdered and denied kings' sepulchers.", circumstance: "dishonored", reignApprox: "~835-796 BC" },
  { name: "Amaziah", kingdom: "judah", tomb: "city-of-david-excluded", burialLocation: "Jerusalem (returned from Lachish)", reference: "2 Chr 25:28", notes: "Killed at Lachish; body returned to city.", circumstance: "dishonored", reignApprox: "~796-767 BC" },
  { name: "Manasseh", kingdom: "judah", tomb: "garden-of-uzza", burialLocation: "Garden of Uzza", reference: "2 Kgs 21:18", notes: "Buried in his house garden precinct.", circumstance: "standard", reignApprox: "~697-643 BC" },
  { name: "Amon", kingdom: "judah", tomb: "garden-of-uzza", burialLocation: "Garden of Uzza", reference: "2 Kgs 21:26", notes: "Follows Manasseh burial location.", circumstance: "standard", reignApprox: "~643-641 BC" },
  { name: "Omri", kingdom: "israel", tomb: "samaria-royal", burialLocation: "Samaria", reference: "1 Kgs 16:28", notes: "Founder of Samaria dynasty center.", circumstance: "standard", reignApprox: "~885-874 BC" },
  { name: "Ahab", kingdom: "israel", tomb: "samaria-royal", burialLocation: "Samaria", reference: "1 Kgs 22:37", notes: "Returned and buried at royal capital.", circumstance: "standard", reignApprox: "~874-853 BC" },
  { name: "Ahaziah of Israel", kingdom: "israel", tomb: "samaria-royal", burialLocation: "Samaria", reference: "1 Kgs 22:51", notes: "Succeeded and buried in Samaria line.", circumstance: "standard", reignApprox: "~853-852 BC" },
  { name: "Jehu", kingdom: "israel", tomb: "samaria-royal", burialLocation: "Samaria", reference: "2 Kgs 10:35", notes: "Buried in Samaria after dynasty upheaval.", circumstance: "standard", reignApprox: "~841-814 BC" },
  { name: "Jehoahaz of Israel", kingdom: "israel", tomb: "samaria-royal", burialLocation: "Samaria", reference: "2 Kgs 13:9", notes: "Buried in Samaria.", circumstance: "standard", reignApprox: "~814-798 BC" },
  { name: "Jehoash of Israel", kingdom: "israel", tomb: "samaria-royal", burialLocation: "Samaria", reference: "2 Kgs 13:13", notes: "Buried with kings of Israel in Samaria.", circumstance: "standard", reignApprox: "~798-782 BC" },
  { name: "Jeroboam II", kingdom: "israel", tomb: "samaria-royal", burialLocation: "Samaria", reference: "2 Kgs 14:29", notes: "Buried with fathers, kings of Israel.", circumstance: "standard", reignApprox: "~793-753 BC" },
  { name: "Pekah", kingdom: "israel", tomb: "samaria-royal", burialLocation: "Samaria", reference: "2 Kgs 15:30-31", notes: "Burial in Samaria noted despite assassination.", circumstance: "standard", reignApprox: "~752-732 BC" },
  { name: "Baasha", kingdom: "israel", tomb: "tirzah", burialLocation: "Tirzah", reference: "1 Kgs 16:6", notes: "Buried in Tirzah, earlier capital.", circumstance: "standard", reignApprox: "~909-886 BC" },
  { name: "Joram (Jehoram) of Israel", kingdom: "israel", tomb: "jezreel-naboth", burialLocation: "Jezreel, field of Naboth", reference: "2 Kgs 9:24-26", notes: "Thrown into Naboth's field by Jehu.", circumstance: "violent", reignApprox: "~852-841 BC" },
  { name: "Josiah", kingdom: "judah", tomb: "josiah-own-tomb", burialLocation: "Jerusalem", reference: "2 Chr 35:24", notes: "Brought to Jerusalem and buried in own tomb.", circumstance: "honored", reignApprox: "~640-609 BC" },
  { name: "Ahaz", kingdom: "judah", tomb: "ahaz-excluded", burialLocation: "Jerusalem", reference: "2 Chr 28:27", notes: "Excluded from tombs of kings of Israel/Judah.", circumstance: "dishonored", reignApprox: "~735-715 BC" },
  { name: "Uzziah", kingdom: "judah", tomb: "uzziah-field", burialLocation: "Field of burial near royal tombs", reference: "2 Chr 26:23", notes: "Separated burial due to leprosy.", circumstance: "dishonored", reignApprox: "~792-740 BC" },
  { name: "Jehoahaz of Judah", kingdom: "judah", tomb: "egypt-captivity", burialLocation: "Egypt", reference: "2 Kgs 23:34", notes: "Died in captivity under Pharaoh Neco.", circumstance: "exile", reignApprox: "~609 BC" },
  { name: "Jehoiakim", kingdom: "judah", tomb: "babylon-unknown", burialLocation: "Unknown / dishonored", reference: "Jer 22:18-19", notes: "Prophetic word of dishonored burial, unclear tomb.", circumstance: "dishonored", reignApprox: "~609-598 BC" },
  { name: "Jehoiachin", kingdom: "judah", tomb: "babylon-unknown", burialLocation: "Babylon exile", reference: "2 Kgs 25:27-30", notes: "Lived in exile; no homeland tomb record.", circumstance: "exile", reignApprox: "~598-597 BC" },
  { name: "Zedekiah", kingdom: "judah", tomb: "babylon-unknown", burialLocation: "Babylon exile", reference: "2 Kgs 25:7", notes: "Taken in chains to Babylon; no burial record.", circumstance: "exile", reignApprox: "~597-586 BC" },
  { name: "Hoshea of Israel", kingdom: "israel", tomb: "babylon-unknown", burialLocation: "Assyrian imprisonment", reference: "2 Kgs 17:4-6", notes: "Imprisoned; burial site not recorded.", circumstance: "exile", reignApprox: "~732-722 BC" },
  { name: "Nadab", kingdom: "israel", tomb: "not-recorded-violent", burialLocation: "Not recorded", reference: "1 Kgs 15:27-28", notes: "Assassinated by Baasha.", circumstance: "violent", reignApprox: "~910-909 BC" },
  { name: "Elah", kingdom: "israel", tomb: "not-recorded-violent", burialLocation: "Tirzah (record unclear)", reference: "1 Kgs 16:9-10", notes: "Killed by Zimri while drinking.", circumstance: "violent", reignApprox: "~886-885 BC" },
  { name: "Zimri", kingdom: "israel", tomb: "not-recorded-violent", burialLocation: "Burned in palace", reference: "1 Kgs 16:18", notes: "Died by fire in palace citadel.", circumstance: "violent", reignApprox: "~885 BC" },
  { name: "Zechariah", kingdom: "israel", tomb: "not-recorded-violent", burialLocation: "Not recorded", reference: "2 Kgs 15:10", notes: "Struck down by Shallum.", circumstance: "violent", reignApprox: "~753 BC" },
  { name: "Shallum", kingdom: "israel", tomb: "not-recorded-violent", burialLocation: "Not recorded", reference: "2 Kgs 15:14", notes: "Killed by Menahem after one month reign.", circumstance: "violent", reignApprox: "~752 BC" },
  { name: "Menahem", kingdom: "israel", tomb: "not-recorded-violent", burialLocation: "Not recorded", reference: "2 Kgs 15:22", notes: "Burial site not named in record.", circumstance: "standard", reignApprox: "~752-742 BC" },
  { name: "Pekahiah", kingdom: "israel", tomb: "not-recorded-violent", burialLocation: "Not recorded", reference: "2 Kgs 15:25", notes: "Assassinated in Samaria citadel.", circumstance: "violent", reignApprox: "~742-740 BC" },
];
