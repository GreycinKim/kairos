/**
 * Writes public/bible-map/data/routes.json — schematic polylines for major biblical journeys.
 * Not exhaustive of every verse-level movement; expand this file over time.
 * Run: node frontend/scripts/write-bible-routes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "../public/bible-map/data/routes.json");

/** @typedef {{ id: string, name: string, summary: string, testament: string[], eras: string[], books: string[], path: [number, number][], labels?: string[], scripture?: { ref: string, text: string }[] }} Route */

/** @type {Route[]} */
const routes = [
  r("abram-ur-haran-canaan", "Terah’s household: Ur → Haran → Canaan", "Genesis 11–12: from Ur of the Chaldeans toward Haran, then Abram into Canaan.", ["OT"], ["patriarchs"], ["Genesis"], [[30.96, 46.1], [36.86, 39.03], [32.21, 35.29], [31.93, 35.22]], ["Ur", "Haran", "Shechem", "Bethel ridge"]),
  r("abram-egypt-return", "Abram: Canaan → Egypt → Negev", "Famine descent to Egypt and return by the Negev (Gen 12).", ["OT"], ["patriarchs"], ["Genesis"], [[31.78, 35.23], [29.85, 31.25], [31.25, 34.79]], ["Hebron area", "Memphis region", "Negev"]),
  r("lot-sodom", "Lot: Bethel toward Sodom plain", "Lot pitches toward Sodom from the Jordan plain (Gen 13).", ["OT"], ["patriarchs"], ["Genesis"], [[31.93, 35.22], [31.85, 35.45], [31.08, 35.42]], ["Bethel", "Jordan", "Sodom region"]),
  r("isaac-gerar-beersheba", "Isaac: Gerar ↔ Beersheba wells", "Famine sojourn in Gerar and well-digging in the Negev (Gen 26).", ["OT"], ["patriarchs"], ["Genesis"], [[31.4, 34.6], [31.25, 34.79], [31.53, 35.1]], ["Gerar", "Beersheba", "Hebron"]),
  r("jacob-laban-return", "Jacob: Haran → Mahanaim → Shechem", "Return from Paddan Aram to Canaan with family and flocks (Gen 31–33).", ["OT"], ["patriarchs"], ["Genesis"], [[36.86, 39.03], [32.2, 35.65], [32.21, 35.29]], ["Haran", "Mahanaim", "Shechem"]),
  r("joseph-slavery-egypt", "Joseph: Dothan → Egypt", "Brothers sell Joseph; Ishmaelites/Midianites toward Egypt (Gen 37).", ["OT"], ["patriarchs"], ["Genesis"], [[32.425, 35.2], [29.85, 31.25]], ["Dothan", "Lower Egypt"]),
  r("israel-exodus-red-sea", "Exodus: Goshen toward Red Sea", "Israel leaves Rameses area toward the sea (Ex 12–14).", ["OT"], ["exodus-conquest"], ["Exodus"], [[30.8, 31.85], [29.52, 32.35]], ["Nile delta", "Sea crossing region"]),
  r("exodus-mar-elim", "Wilderness: Marah → Elim", "Bitter waters then Elim’s springs (Ex 15).", ["OT"], ["exodus-conquest"], ["Exodus"], [[29.3, 32.8], [28.9, 33.2]], ["Marah (schematic)", "Elim"]),
  r("exodus-sinai", "Israel: wilderness → Sinai", "Journey to the mountain of God (Ex 19).", ["OT"], ["exodus-conquest"], ["Exodus"], [[28.55, 33.42], [28.5394, 33.9753]], ["Wilderness", "Sinai (Horeb)"]),
  r("spies-canaan-return", "Twelve spies: Kadesh → Hebron ridge → return", "Mission from Kadesh into the hill country (Num 13).", ["OT"], ["exodus-conquest"], ["Numbers"], [[30.688, 34.433], [31.65, 34.97], [30.688, 34.433]], ["Kadesh", "Hebron hills", "Kadesh"]),
  r("israel-jordan-jericho", "Israel: Jordan → Gilgal → Jericho", "Crossing and camp opposite Jericho (Josh 3–4).", ["OT"], ["exodus-conquest"], ["Joshua"], [[31.85, 35.57], [31.926, 35.45], [31.8561, 35.4622]], ["Jordan ford", "Gilgal", "Jericho"]),
  r("southern-campaign", "Joshua: southern coalition sweep", "Southern kings coalition toward Gibeon then descent (Josh 10).", ["OT"], ["exodus-conquest"], ["Joshua"], [[31.848, 35.178], [31.71, 34.89], [31.564, 34.85]], ["Gibeon", "Jarmuth", "Lachish"]),
  r("dan-migration", "Dan: west toward Laish", "Tribe scouts and migration north to Laish (Judg 18).", ["OT"], ["divided-kingdom"], ["Judges"], [[31.7, 34.85], [33.248, 35.602]], ["Philistine border", "Dan/Laish"]),
  r("ark-kirjath-jearim-shiloh", "Ark: Ebenezer → Kirjath Jearim (schematic)", "Philistine capture and return arc (1 Sam 4–7).", ["OT"], ["united-kingdom"], ["1 Samuel"], [[31.78, 34.85], [31.771, 35.107]], ["Philistia", "Kiriath Jearim"]),
  r("david-goliath-pursuit", "Saul & David: valley of Elah pursuit", "Philistine muster and pursuit toward Ekron (1 Sam 17).", ["OT"], ["united-kingdom"], ["1 Samuel"], [[31.68, 34.98], [31.778, 34.85]], ["Socoh", "Ekron"]),
  r("david-flee-saul", "David: Gibeah area → wilderness refuges", "Flight through wilderness strongholds (1 Sam 19–23).", ["OT"], ["united-kingdom"], ["1 Samuel"], [[31.85, 35.22], [31.48, 35.18], [31.45, 35.39]], ["Gibeah", "Ziph", "En Gedi"]),
  r("david-ziklag-philistia", "David: Judah toward Ziklag", "Dwelling among Philistines at Ziklag (1 Sam 27).", ["OT"], ["united-kingdom"], ["1 Samuel"], [[31.53, 35.1], [31.38, 34.62]], ["Hebron area", "Ziklag"]),
  r("absalom-revolt", "Absalom: Hebron → Jerusalem", "Revolt route toward David’s capital (2 Sam 15–18).", ["OT"], ["united-kingdom"], ["2 Samuel"], [[31.5326, 35.0998], [31.7683, 35.2137]], ["Hebron", "Jerusalem"]),
  r("elijah-carmel-jezreel", "Elijah: Carmel to Jezreel", "After Carmel, Elijah runs before Ahab’s chariot (1 Kgs 18).", ["OT"], ["divided-kingdom"], ["1 Kings"], [[32.732, 34.985], [32.51, 35.21]], ["Carmel", "Jezreel"]),
  r("elijah-horeb", "Elijah: Beersheba → Horeb", "Forty-day wilderness journey to the mount of God (1 Kgs 19).", ["OT"], ["divided-kingdom"], ["1 Kings"], [[31.25, 34.79], [28.5394, 33.9753]], ["Beersheba", "Horeb"]),
  r("jonah-joppa-sea", "Jonah: Joppa toward Tarshish", "Flees by ship from Joppa (Jon 1).", ["OT"], ["divided-kingdom"], ["Jonah"], [[32.054, 34.752], [35.5, 28.0]], ["Joppa", "West Mediterranean (schematic)"]),
  r("jonah-nineveh", "Jonah: Nineveh circuit", "Obedient preaching walk in the great city (Jon 3).", ["OT"], ["divided-kingdom"], ["Jonah"], [[36.3594, 43.1528], [36.37, 43.18], [36.35, 43.14]], ["Nineveh gate area", "—", "—"]),
  r("exile-babylon", "Judah: Jerusalem → Babylon", "Exile march east to Babylon (2 Kgs 25; Ps 137).", ["OT"], ["exile-return"], ["2 Kings", "Psalms"], [[31.7683, 35.2137], [33.1, 38.5], [32.5355, 44.4275]], ["Jerusalem", "Desert arc", "Babylon"]),
  r("exiles-return", "Return: Babylon → Jerusalem", "Zerubbabel’s caravan horizon (Ezra 1–2).", ["OT"], ["exile-return"], ["Ezra"], [[32.5355, 44.4275], [34.5, 40.0], [31.7683, 35.2137]], ["Babylon", "Fertile Crescent", "Jerusalem"]),
  r("alexander-to-east", "Greek era: coast to interior (schematic)", "Hellenistic city networks linking coast and Decapolis (intertestamental).", ["OT"], ["second-temple"], ["1 Maccabees"], [[32.498, 34.8918], [32.88, 35.5754], [32.91, 35.63]], ["Caesarea", "Capernaum", "Bethsaida"]),
  r("mary-joseph-bethlehem", "Mary & Joseph: Galilee to Bethlehem", "Census journey for Jesus’ birth (Lk 2).", ["NT"], ["jesus-ministry"], ["Luke"], [[32.6996, 35.3035], [31.7054, 35.2024]], ["Nazareth", "Bethlehem"]),
  r("jesus-baptism", "Jesus: Nazareth area → Jordan", "Baptism at the Jordan (Mk 1; Mt 3).", ["NT"], ["jesus-ministry"], ["Gospels"], [[32.6996, 35.3035], [32.18, 35.57]], ["Nazareth", "Jordan"]),
  r("jesus-galilee-circuit", "Jesus: Galilee preaching circuit", "Synagogue-to-synagogue ministry around the lake (Mk 1–6).", ["NT"], ["jesus-ministry"], ["Gospels"], [[32.88, 35.5754], [32.826, 35.588], [32.732, 34.985], [32.6996, 35.3035]], ["Capernaum", "Sea circuit", "Carmel", "Nazareth"]),
  r("jesus-decapolis", "Jesus: Decapolis region loop", "Pig herd cliff and Gentile mission hints (Mk 5).", ["NT"], ["jesus-ministry"], ["Mark"], [[32.88, 35.5754], [32.65, 35.75], [32.88, 35.5754]], ["Capernaum", "Gerasa region", "Return"]),
  r("jesus-samaria-jerusalem", "Jesus: Galilee → Samaria → Judea", "Luke travel narrative toward Jerusalem (Lk 9–19).", ["NT"], ["jesus-ministry"], ["Luke"], [[32.6996, 35.3035], [32.224, 35.268], [31.7683, 35.2137]], ["Galilee", "Sychar", "Jerusalem"]),
  r("jesus-passion-entry", "Jesus: Jericho → Bethany → Jerusalem", "Final ascent and triumphal entry (Mk 10–11).", ["NT"], ["jesus-ministry"], ["Gospels"], [[31.8561, 35.4622], [31.771, 35.262], [31.7683, 35.2137]], ["Jericho", "Bethany", "Jerusalem"]),
  r("road-emmaus", "Emmaus road", "Two disciples walk and recognize the risen Lord (Lk 24).", ["NT"], ["jesus-ministry"], ["Luke"], [[31.7683, 35.2137], [31.84, 34.98]], ["Jerusalem", "Emmaus (trad.)"]),
  r("philip-gaza", "Philip: Jerusalem → Gaza road", "Ethiopian eunuch on the desert road (Acts 8).", ["NT"], ["early-church"], ["Acts"], [[31.7683, 35.2137], [31.5, 34.4667]], ["Jerusalem", "Gaza road"]),
  r("paul-damascus-road", "Saul: Jerusalem → Damascus", "Conversion journey interrupted near Damascus (Acts 9).", ["NT"], ["early-church"], ["Acts"], [[31.7683, 35.2137], [35.5, 37.0], [33.5138, 36.2765]], ["Jerusalem", "Syrian desert arc", "Damascus"]),
  r("paul-first-journey-antioch", "Paul I: Antioch → Cyprus", "Sent from Syrian Antioch to Salamis (Acts 13).", ["NT"], ["early-church"], ["Acts"], [[36.2026, 36.1606], [35.18, 33.9]], ["Antioch", "Salamis"]),
  r("paul-pamphylia-pisidia", "Paul I: Perga → Pisidian Antioch", "Inland to Pisidian Antioch (Acts 13–14).", ["NT"], ["early-church"], ["Acts"], [[36.96, 30.85], [37.83, 31.17]], ["Perga", "Pisidian Antioch"]),
  r("paul-iconium-lystra", "Paul I: Iconium → Lystra → Derbe", "Southern Galatian cities (Acts 14).", ["NT"], ["early-church"], ["Acts"], [[37.8667, 32.4833], [37.59, 32.35], [37.35, 33.3]], ["Iconium", "Lystra", "Derbe"]),
  r("paul-return-attalia", "Paul I: coast return to Attalia", "Sailed from Attalia to Antioch (Acts 14).", ["NT"], ["early-church"], ["Acts"], [[37.35, 33.3], [36.88, 30.68], [36.2026, 36.1606]], ["Derbe", "Attalia", "Antioch"]),
  r("paul-second-journey-europe", "Paul II: Troas → Neapolis → Philippi", "Macedonian call and first European landing (Acts 16).", ["NT"], ["early-church"], ["Acts"], [[39.75, 26.15], [40.939, 24.406], [41.013, 24.286]], ["Troas", "Neapolis", "Philippi"]),
  r("paul-amphipolis-thessalonica", "Paul II: Amphipolis → Thessalonica", "Coastal road mission (Acts 17).", ["NT"], ["early-church"], ["Acts"], [[40.82, 23.847], [40.587, 22.45], [40.6401, 22.9444]], ["Amphipolis", "Apollonia", "Thessalonica"]),
  r("paul-berea-athens", "Paul II: Berea → Athens", "Philosophers and Areopagus (Acts 17).", ["NT"], ["early-church"], ["Acts"], [[40.523, 22.202], [38.4237, 23.7275]], ["Berea", "Athens"]),
  r("paul-corinth-ephesus", "Paul II: Corinth ↔ Ephesus", "Extended Corinth stay then Ephesian base (Acts 18–19).", ["NT"], ["early-church"], ["Acts"], [[37.938, 22.932], [37.939, 27.341]], ["Corinth", "Ephesus"]),
  r("paul-third-journey-miletus", "Paul III: Ephesus → Miletus", "Farewell to elders (Acts 20).", ["NT"], ["early-church"], ["Acts"], [[37.939, 27.341], [37.53, 27.28]], ["Ephesus", "Miletus"]),
  r("paul-coast-asia", "Paul III: Troas → Assos → Chios → Samos", "Return voyage legs (Acts 20).", ["NT"], ["early-church"], ["Acts"], [[39.75, 26.15], [39.487, 26.336], [38.368, 26.135], [37.754, 26.976]], ["Troas", "Assos", "Chios", "Samos"]),
  r("paul-jerusalem-custody", "Paul: Ephesus → Jerusalem", "Return and arrest in the temple courts (Acts 21).", ["NT"], ["early-church"], ["Acts"], [[37.939, 27.341], [36.96, 30.85], [31.7683, 35.2137]], ["Ephesus", "Caesarea Maritima", "Jerusalem"]),
  r("paul-caesarea-rome-ship", "Paul: Caesarea → Rome (sea arc)", "Custody voyage with shipwreck and Italy landings (Acts 27–28).", ["NT"], ["early-church"], ["Acts"], [[32.498, 34.8918], [36.244, 29.985], [36.685, 27.373], [35.937, 14.375], [37.075, 15.286], [40.832, 14.121], [41.9028, 12.4964]], ["Caesarea", "Myra", "Cnidus", "Malta", "Syracuse", "Puteoli", "Rome"]),
  r("wise-men-jerusalem-bethlehem", "Magi: Jerusalem → Bethlehem", "Star-led inquiry and short journey south (Mt 2).", ["NT"], ["jesus-ministry"], ["Matthew"], [[31.7683, 35.2137], [31.7054, 35.2024]], ["Jerusalem", "Bethlehem"]),
  r("ark-noah-mountains", "Noah’s ark: mountains of Ararat region", "Resting of the ark in the eastern highlands (Gen 8).", ["OT"], ["patriarchs"], ["Genesis"], [[39.7, 44.3], [39.72, 44.28]], ["Ararat region"]),
  r("abraham-mamre-hebron", "Abraham: Mamre / Hebron orbit", "Tent life near the oaks of Mamre (Gen 13; 18).", ["OT"], ["patriarchs"], ["Genesis"], [[31.53, 35.1], [31.5326, 35.0998]], ["Hebron approach", "Hebron"]),
  r("census-quirinius-schematic", "Judea ↔ Galilee travel (schematic)", "Population movements under Roman administration (Lk 2:1–5 context).", ["NT"], ["jesus-ministry"], ["Luke"], [[31.7683, 35.2137], [32.6996, 35.3035]], ["Jerusalem", "Nazareth"]),
  r("peter-joppa-caesarea", "Peter: Lydda → Joppa → Caesarea", "Healing Dorcas then Cornelius’ house (Acts 9–10).", ["NT"], ["early-church"], ["Acts"], [[32.001, 34.888], [32.054, 34.752], [32.498, 34.8918]], ["Lydda", "Joppa", "Caesarea"]),
  r("silas-jerusalem-letter", "Judizers journey (schematic)", "Controversy resolved; letter carried from Jerusalem council horizon (Acts 15).", ["NT"], ["early-church"], ["Acts"], [[31.7683, 35.2137], [36.2026, 36.1606]], ["Jerusalem", "Antioch"]),
  r("benhadad-aphek", "Syrian campaign toward Aphek (schematic)", "Aramean wars near Israel’s interior (1 Kgs 20).", ["OT"], ["divided-kingdom"], ["1 Kings"], [[33.5138, 36.2765], [32.55, 35.32]], ["Damascus", "Jezreel Aphek"]),
  r("assyria-samaria-deportation", "Assyria ↔ Samaria (schematic)", "Northern exile horizon (2 Kgs 17).", ["OT"], ["divided-kingdom"], ["2 Kings"], [[32.2763, 35.1982], [36.3594, 43.1528]], ["Samaria", "Nineveh region"]),
  r("josiah-megiddo", "Josiah: Jerusalem toward Megiddo", "Final campaign to Pharaoh Neco (2 Kgs 23).", ["OT"], ["divided-kingdom"], ["2 Kings"], [[31.7683, 35.2137], [32.5842, 35.1821]], ["Jerusalem", "Megiddo"]),
  r("nehemiah-wall-circuit", "Nehemiah: Jerusalem wall circuit", "Inspection and rebuilding circuit (Neh 2–3).", ["OT"], ["exile-return"], ["Nehemiah"], [[31.772, 35.234], [31.78, 35.22], [31.765, 35.24], [31.772, 35.234]], ["Valley gate", "Sheep gate", "Fish gate", "Start"]),
  r("christophany-jacob-peniel", "Jacob: Jabbok ford at Peniel", "Wrestling at the ford (Gen 32).", ["OT"], ["patriarchs"], ["Genesis"], [[32.2, 35.65], [32.2, 35.6]], ["Mahanaim", "Peniel"]),
  r("balak-balaam-highlands", "Balak: Moab heights circuit", "Altars on high places overlooking Israel (Num 22–24).", ["OT"], ["exodus-conquest"], ["Numbers"], [[31.8, 35.72], [31.5, 35.8], [31.6, 35.75]], ["Nebo view", "Peor", "Zophim"]),
  r("ruth-bethlehem-moab", "Ruth: Bethlehem ↔ Moab", "Famine sojourn and return (Ruth 1).", ["OT"], ["united-kingdom"], ["Ruth"], [[31.7054, 35.2024], [31.5, 35.75], [31.7054, 35.2024]], ["Bethlehem", "Moab plateau", "Bethlehem"]),
  r("solomon-timber-lebanon", "Tyre ↔ Jerusalem (cedar trade)", "Hiram’s logs for the Temple (1 Kgs 5).", ["OT"], ["united-kingdom"], ["1 Kings"], [[33.27, 35.195], [31.7683, 35.2137]], ["Tyre", "Jerusalem"]),
  r("queen-sheba-jerusalem", "Sheba → Jerusalem (schematic)", "Royal visit to Solomon (1 Kgs 10).", ["OT"], ["united-kingdom"], ["1 Kings"], [[14.5, 39.0], [31.7683, 35.2137]], ["South Arabia (schematic)", "Jerusalem"]),
  r("hezekiah-sennacherib", "Assyrian approach to Jerusalem (schematic)", "Sennacherib’s campaign and withdrawal (2 Kgs 18–19).", ["OT"], ["divided-kingdom"], ["2 Kings"], [[31.564, 34.85], [31.78, 35.2137]], ["Lachish", "Jerusalem"]),
  r("jeremiah-egypt-tahpanhes", "Refugees: Judah toward Egypt", "Flight after Gedaliah (Jer 41–43).", ["OT"], ["divided-kingdom"], ["Jeremiah"], [[31.7683, 35.2137], [31.05, 32.53]], ["Jerusalem", "Tahpanhes region"]),
  r("ezra-return-caravan", "Babylon → Jerusalem (Ezra’s band)", "Second return with Torah emphasis (Ezr 7–8).", ["OT"], ["exile-return"], ["Ezra"], [[32.5355, 44.4275], [34.8, 39.0], [31.7683, 35.2137]], ["Babylon", "Desert", "Jerusalem"]),
  r("magi-return-home", "Magi: Bethlehem → east (schematic)", "Warned in a dream not to return to Herod (Mt 2:12).", ["NT"], ["jesus-ministry"], ["Matthew"], [[31.7054, 35.2024], [35.0, 38.0]], ["Bethlehem", "East (schematic)"]),
  r("jesus-tyre-sidon", "Jesus: Galilee toward Tyre and Sidon", "Gentile daughter’s faith (Mk 7).", ["NT"], ["jesus-ministry"], ["Mark"], [[32.88, 35.5754], [33.27, 35.195], [33.563, 35.368]], ["Capernaum", "Tyre", "Sidon"]),
  r("paul-rome-spain-intent", "Paul: Rome westward horizon (schematic)", "Romans 15:24 Spain intention.", ["NT"], ["early-church"], ["Romans"], [[41.9028, 12.4964], [41.0, 1.5]], ["Rome", "Iberia (schematic)"]),
  r("apollos-alexandria-ephesus", "Apollos: Alexandria → Ephesus (schematic)", "Learned Alexandrian in Ephesus (Acts 18).", ["NT"], ["early-church"], ["Acts"], [[31.2, 29.92], [37.939, 27.341]], ["Alexandria", "Ephesus"]),
  r("titus-crete-cities", "Titus: Crete church circuit (schematic)", "Appoint elders in every town (Tit 1:5).", ["NT"], ["early-church"], ["Titus"], [[35.068, 24.947], [35.2, 24.08], [34.92, 24.78]], ["Gortyn", "Phoenix area", "Fair Havens"]),
  r("john-patmos-deport", "John: Asia to Patmos", "Exile on Patmos for the word (Rev 1:9).", ["NT"], ["early-church"], ["Revelation"], [[37.939, 27.341], [37.309, 26.547]], ["Ephesus", "Patmos"]),
  r("philip-samaria-gaza", "Philip: Samaria → Gaza road", "Preaching in Samaria then the desert road (Acts 8).", ["NT"], ["early-church"], ["Acts"], [[32.2763, 35.1982], [31.5, 34.4667]], ["Samaria city", "Gaza road"]),
  r("stephen-history-orbit", "Abraham to Moses arc (theological path)", "Stephen’s speech geography (Acts 7) — thematic, not one journey.", ["NT"], ["early-church"], ["Acts"], [[30.96, 46.1], [31.7683, 35.2137], [29.85, 31.25]], ["Mesopotamia", "Land of Canaan", "Egypt"]),
];

function r(id, name, summary, testament, eras, books, path, labels) {
  return { id, name, summary, testament, eras, books, path, labels: labels || null };
}

fs.writeFileSync(out, JSON.stringify(routes, null, 2), "utf8");
console.log("Wrote", routes.length, "routes to", out);
