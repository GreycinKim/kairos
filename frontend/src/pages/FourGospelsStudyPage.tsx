import { useEffect, useMemo, useState } from "react";

type HarmonyRow = {
  category: string;
  subject: string;
  matthew?: string;
  mark?: string;
  luke?: string;
  john?: string;
  isSection?: boolean;
};

type MiniCard = {
  title: string;
  points: string[];
};

type Parable = {
  name: string;
  category: "Kingdom" | "Grace & Forgiveness" | "Prayer" | "Stewardship" | "Judgment" | "Israel";
  refs: string;
  gospels: ("M" | "Mk" | "L" | "J")[];
  theme: string;
  meaning: string;
};

type Miracle = {
  name: string;
  category: "Healing" | "Nature" | "Resurrection" | "Deliverance";
  refs: string;
  blurb: string;
};

const NAV = [
  ["timeline-overview", "Timeline Overview"],
  ["harmony", "Harmony of the Gospels"],
  ["sermon", "The Sermon on the Mount"],
  ["parables", "The Parables"],
  ["miracles", "The Miracles"],
  ["last-week", "The Last Week"],
  ["resurrection", "Resurrection & Ascension"],
] as const;

const periodCards: MiniCard[] = [
  {
    title: "Early Life & Birth (Before 27 AD)",
    points: [
      "Virgin birth announced (Luke 1:26-38)",
      "Birth of Jesus (Matt 1:18-25, Luke 2:1-7)",
      "Wise men visit (Matt 2:1-12)",
      "Flight to Egypt (Matt 2:13-23)",
      "Jesus in temple at 12 (Luke 2:40-52)",
    ],
  },
  {
    title: "Beginning of Ministry (27 AD)",
    points: [
      "Ministry of John the Baptist (Matt 3:1-12, Mark 1:1-8, Luke 3:1-18, John 1:15-31)",
      "Baptism of Jesus (Matt 3:13-17, Mark 1:9-11, Luke 3:21-22, John 1:32-34)",
      "Temptation (Matt 4:1-11, Mark 1:12-13, Luke 4:1-13)",
      "First disciples (John 1:35-51)",
      "Wedding at Cana (John 2:1-11)",
    ],
  },
  {
    title: "Great Galilean Ministry (28 AD)",
    points: [
      "Sermon on the Mount (Matt 5-7, Luke 6:17-49)",
      "Kingdom Parables",
      "Miracles across Galilee",
      "Feeding the 5000 (Matt 14:13-21, Mark 6:30-44, Luke 9:10-17, John 6:1-15)",
    ],
  },
  {
    title: "Ministry in Various Places (29 AD)",
    points: [
      "Peter's confession (Matt 16:13-19, Mark 8:27-29, Luke 9:18-20)",
      "Transfiguration (Matt 17:1-9, Mark 9:2-10, Luke 9:28-36)",
      "Ministry in Jerusalem",
      "Raising of Lazarus (John 11:1-44)",
    ],
  },
  {
    title: "The Last Week & Beyond (30 AD)",
    points: [
      "Triumphal entry (Matt 21:1-11, Mark 11:1-10, Luke 19:29-44, John 12:12-19)",
      "Last Supper",
      "Gethsemane -> Arrest -> Trial",
      "Crucifixion -> Burial",
      "Resurrection -> Ascension",
    ],
  },
];

const harmonyRows: HarmonyRow[] = [
  { category: "Birth & Early Life", subject: "SECTION: Pre-Christ Narratives", isSection: true },
  { category: "Birth & Early Life", subject: "St. Luke's preface", luke: "1:1-4" },
  { category: "Birth & Early Life", subject: '"God the Word"', john: "1:1-14" },
  { category: "Birth & Early Life", subject: "SECTION: Birth and Early Childhood", isSection: true },
  { category: "Birth & Early Life", subject: "Birth of John Baptist foretold", luke: "1:5-25" },
  { category: "Birth & Early Life", subject: "Annunciation of birth of Jesus", luke: "1:26-38" },
  { category: "Birth & Early Life", subject: "Mary visits Elizabeth", luke: "1:39-56" },
  { category: "Birth & Early Life", subject: "Birth of John the Baptist", luke: "1:57-80" },
  { category: "Birth & Early Life", subject: "The two genealogies", matthew: "1:1-17", luke: "3:23-38" },
  { category: "Birth & Early Life", subject: "Birth of Jesus Christ", matthew: "1:18-25", luke: "2:1-7" },
  { category: "Birth & Early Life", subject: "The watching shepherds", luke: "2:8-20" },
  { category: "Birth & Early Life", subject: "The circumcision", luke: "2:21" },
  { category: "Birth & Early Life", subject: "Presentation in the temple", luke: "2:22-38" },
  { category: "Birth & Early Life", subject: "The wise men from the East", matthew: "2:1-12" },
  { category: "Birth & Early Life", subject: "Flight into Egypt, return to Nazareth", matthew: "2:13-23", luke: "2:39" },
  { category: "Birth & Early Life", subject: "Christ in the temple with the doctors", luke: "2:40-52" },
  { category: "Baptism", subject: "SECTION: Baptism of Christ", isSection: true },
  { category: "Baptism", subject: "Ministry of John the Baptist", matthew: "3:1-12", mark: "1:1-8", luke: "3:1-18", john: "1:15-31" },
  { category: "Baptism", subject: "Baptism of Jesus Christ", matthew: "3:13-17", mark: "1:9-11", luke: "3:21-22", john: "1:32-34" },
  { category: "Temptation", subject: "SECTION: Temptation of Christ", isSection: true },
  { category: "Temptation", subject: "The temptation", matthew: "4:1-11", mark: "1:12-13", luke: "4:1-13" },
  { category: "Early Ministry", subject: "SECTION: Early Ministry of Christ", isSection: true },
  { category: "Early Ministry", subject: "Andrew and Simon Peter called", john: "1:35-42" },
  { category: "Early Ministry", subject: "Philip and Nathanael", john: "1:43-51" },
  { category: "Early Ministry", subject: "Marriage in Cana of Galilee", john: "2:1-11" },
  { category: "Early Ministry", subject: "Passover and cleansing the temple", john: "2:12-25" },
  { category: "Early Ministry", subject: "Nicodemus comes to Jesus by night", john: "3:1-21" },
  { category: "Early Ministry", subject: "Christ and John baptizing", john: "3:22; 4:2" },
  { category: "Early Ministry", subject: "Christ at the well of Sychar", john: "4:3-42" },
  { category: "Early Ministry", subject: "John the Baptist in prison", matthew: "4:12; 14:3", mark: "1:14; 6:17", luke: "3:19-20", john: "3:24" },
  { category: "Early Ministry", subject: "Christ returns to Galilee", matthew: "4:12", mark: "1:14-15", luke: "4:14-15", john: "4:43-45" },
  { category: "Early Ministry", subject: "The synagogue at Nazareth", luke: "4:16-30" },
  { category: "Early Ministry", subject: "Andrew, Simon, James and John called", matthew: "4:13-22", mark: "1:16-20", luke: "5:1-11" },
  { category: "Miracles", subject: "SECTION: Miracles of Christ", isSection: true },
  { category: "Miracles", subject: "The nobleman's son at Capernaum healed", john: "4:46-54" },
  { category: "Miracles", subject: "The demoniac in the synagogue healed", mark: "1:21-28", luke: "4:31-37" },
  { category: "Miracles", subject: "Simon's wife's mother healed", matthew: "8:14-17", mark: "1:29-34", luke: "4:38-41" },
  { category: "Miracles", subject: "Circuit round Galilee", matthew: "4:23-25", mark: "1:35-39", luke: "4:42-44" },
  { category: "Miracles", subject: "Healing a leper", matthew: "8:1-4", mark: "1:40-45", luke: "5:12-16" },
  { category: "Miracles", subject: "Christ stills the storm", matthew: "8:18-27", mark: "4:35-41", luke: "8:22-25" },
  { category: "Miracles", subject: "Demoniacs in the land of the Gadarenes", matthew: "8:28-34", mark: "5:1-20", luke: "8:26-39" },
  { category: "Miracles", subject: "Jairus' daughter. Woman healed", matthew: "9:18-26", mark: "5:21-43", luke: "8:40-56" },
  { category: "Miracles", subject: "Blind men and demoniac", matthew: "9:27-34" },
  { category: "Miracles", subject: "Healing the paralytic", matthew: "9:1-8", mark: "2:1-12", luke: "5:17-26" },
  { category: "Miracles", subject: "Matthew the publican", matthew: "9:9-13", mark: "2:13-17", luke: "5:27-32" },
  { category: "Jerusalem Ministry", subject: "SECTION: Feast and Miracle at Bethesda", isSection: true },
  { category: "Jerusalem Ministry", subject: "The feast at Jerusalem", john: "5:1" },
  { category: "Jerusalem Ministry", subject: "The pool of Bethesda", john: "5:2-15" },
  { category: "Jerusalem Ministry", subject: "Jesus and the irate Jews", john: "5:16-47" },
  { category: "Parables", subject: "SECTION: Ministry and Parables", isSection: true },
  { category: "Parables", subject: "Plucking ears of corn on the Sabbath", matthew: "12:1-8", mark: "2:23-28", luke: "6:1-5" },
  { category: "Parables", subject: "The withered hand. Miracles", matthew: "12:9-21", mark: "3:1-12", luke: "6:6-11" },
  { category: "Parables", subject: "The twelve apostles", matthew: "10:2-4", mark: "3:13-19", luke: "6:12-16" },
  { category: "Parables", subject: "The sermon on the mount", matthew: "5:1-7:29", luke: "6:17-49" },
  { category: "Parables", subject: "The centurion's servant healed", matthew: "8:5-13", luke: "7:1-10" },
  { category: "Parables", subject: "The widow's son at Nain", luke: "7:11-17" },
  { category: "Parables", subject: "Messengers from John", matthew: "11:2-19", luke: "7:18-35" },
  { category: "Parables", subject: "Woe denounced to the cities of Galilee", matthew: "11:20-24" },
  { category: "Parables", subject: "Parable of the sower", matthew: "13:1-23", mark: "4:1-20", luke: "8:4-15" },
  { category: "Parables", subject: "Parable of the wheat and tares", matthew: "13:24-30" },
  { category: "Parables", subject: "Parable of the mustard seed", matthew: "13:31-32", mark: "4:30-32", luke: "13:18-19" },
  { category: "Parables", subject: "Parable of the leaven", matthew: "13:33", luke: "13:20-21" },
  { category: "Parables", subject: "The hid treasure, the pearl, the net", matthew: "13:44-52" },
  { category: "Parables", subject: "Sending forth of the twelve", matthew: "10:5-42", mark: "6:7-13", luke: "9:1-6" },
  { category: "Parables", subject: "Feeding the five thousand", matthew: "14:13-21", mark: "6:30-44", luke: "9:10-17", john: "6:1-15" },
  { category: "Parables", subject: "Christ walking on the sea", matthew: "14:22-33", mark: "6:45-52", john: "6:16-21" },
  { category: "Parables", subject: '"The bread of life"', john: "6:22-65" },
  { category: "Parables", subject: "Peter's profession of faith", matthew: "16:13-19", mark: "8:27-29", luke: "9:18-20", john: "6:66-71" },
  { category: "Parables", subject: "The transfiguration", matthew: "17:1-9", mark: "9:2-10", luke: "9:28-36" },
  { category: "Parables", subject: "Death of John the Baptist", matthew: "14:3-12", mark: "6:17-29" },
  { category: "Parables", subject: "The Syrophoenician woman", matthew: "15:21-28", mark: "7:24-30" },
  { category: "Parables", subject: "Feeding the four thousand", matthew: "15:32-39", mark: "8:1-9" },
  { category: "Jerusalem Ministry", subject: "SECTION: Ministry in Jerusalem", isSection: true },
  { category: "Jerusalem Ministry", subject: "Journey to Jerusalem", luke: "9:51", john: "7:1-10" },
  { category: "Jerusalem Ministry", subject: "Teaching at feast of tabernacles", john: "7:11-53" },
  { category: "Jerusalem Ministry", subject: "Woman taken in adultery", john: "8:1-11" },
  { category: "Jerusalem Ministry", subject: "Dispute with the Pharisees", john: "8:12-59" },
  { category: "Jerusalem Ministry", subject: "The man born blind", john: "9:1-41" },
  { category: "Jerusalem Ministry", subject: "The good shepherd", john: "10:1-21" },
  { category: "Jerusalem Ministry", subject: "Feast of the dedication", john: "10:22-30" },
  { category: "Jerusalem Ministry", subject: "Mission of the seventy", luke: "10:1-16" },
  { category: "Jerusalem Ministry", subject: "The good Samaritan", luke: "10:25-37" },
  { category: "Jerusalem Ministry", subject: "Mary and Martha", luke: "10:38-42" },
  { category: "Jerusalem Ministry", subject: "The Lord's prayer", matthew: "6:9-13", luke: "11:1-4" },
  { category: "Jerusalem Ministry", subject: "The Pharisees", matthew: "23:1-39", luke: "11:37-54" },
  { category: "Jerusalem Ministry", subject: "Raising of Lazarus", john: "11:1-44" },
  { category: "Jerusalem Ministry", subject: "Zaccheus", luke: "19:1-10" },
  { category: "Jerusalem Ministry", subject: "Parable of the ten talents", matthew: "25:14-30", luke: "19:11-28" },
  { category: "Last Week", subject: "SECTION: Towards and At Jerusalem", isSection: true },
  { category: "Last Week", subject: "Christ enters Jerusalem", matthew: "21:1-11", mark: "11:1-10", luke: "19:29-44", john: "12:12-19" },
  { category: "Last Week", subject: "Cleansing the temple (second)", matthew: "21:12-16", mark: "11:15-18", luke: "19:45-48" },
  { category: "Last Week", subject: "The barren fig tree", matthew: "21:17-22", mark: "11:11-14; 11:19-23" },
  { category: "Last Week", subject: "Parable of the wicked husbandmen", matthew: "21:33-46", mark: "12:1-12", luke: "20:9-18" },
  { category: "Last Week", subject: "The tribute money", matthew: "22:15-22", mark: "12:13-17", luke: "20:20-26" },
  { category: "Last Week", subject: "The great commandment", matthew: "22:34-40", mark: "12:28-34" },
  { category: "Last Week", subject: "Christ's second coming foretold", matthew: "24:1-51", mark: "13:1-37", luke: "21:5-36" },
  { category: "Last Week", subject: "Parable of the ten virgins", matthew: "25:1-13" },
  { category: "Last Week", subject: "The last judgment", matthew: "25:31-46" },
  { category: "Last Week", subject: "Last passover. Conspiracy of Jews", matthew: "26:1-5", mark: "14:1-2", luke: "22:1-2" },
  { category: "Last Week", subject: "Judas Iscariot", matthew: "26:14-16", mark: "14:10-11", luke: "22:3-6" },
  { category: "Last Week", subject: "Paschal supper (Last Supper)", matthew: "26:17-30", mark: "14:12-26", luke: "22:7-23", john: "13:1-35" },
  { category: "Last Week", subject: "Peter's fall foretold", matthew: "26:31-35", mark: "14:27-31", luke: "22:31-39", john: "13:36-38" },
  { category: "Last Week", subject: "Last discourse. The Comforter", john: "14:1-31" },
  { category: "Last Week", subject: "The vine and the branches", john: "15:1-27" },
  { category: "Last Week", subject: "The prayer of Christ", john: "17:1-26" },
  { category: "Last Week", subject: "Gethsemane", matthew: "26:36-46", mark: "14:32-42", luke: "22:40-46", john: "18:1" },
  { category: "Last Week", subject: "SECTION: Betrayal and Trial", isSection: true },
  { category: "Last Week", subject: "The betrayal", matthew: "26:47-56", mark: "14:43-52", luke: "22:47-53", john: "18:2-11" },
  { category: "Last Week", subject: "Christ before Annas and Caiaphas", matthew: "26:57-58; 26:69-75", mark: "14:53-54; 14:66-72", luke: "22:54-65", john: "18:12-27" },
  { category: "Last Week", subject: "Christ before the Sanhedrin", matthew: "26:59-68", mark: "14:55-65", luke: "22:66-71" },
  { category: "Last Week", subject: "Christ before Pilate", matthew: "27:1-2; 27:11-14", mark: "15:1-5", luke: "23:1-6", john: "18:33-40" },
  { category: "Last Week", subject: "Christ before Herod", luke: "23:7-12" },
  { category: "Last Week", subject: "Accusation and condemnation", matthew: "27:15-26", mark: "15:6-15", luke: "23:13-25", john: "18:29; 19:16" },
  { category: "Last Week", subject: "SECTION: Crucifixion and Burial", isSection: true },
  { category: "Last Week", subject: "Treatment by the soldiers", matthew: "27:27-31", mark: "15:16-20", luke: "23:36-37", john: "19:1-3" },
  { category: "Last Week", subject: "The crucifixion", matthew: "27:32-38", mark: "15:21-28", luke: "23:26-34", john: "19:17-24" },
  { category: "Last Week", subject: "Mockings and railings", matthew: "27:39-44", mark: "15:29-32", luke: "23:35-39" },
  { category: "Last Week", subject: "The penitent malefactor", luke: "23:40-43" },
  { category: "Last Week", subject: "The death of Christ", matthew: "27:50", mark: "15:37", luke: "23:46", john: "19:28-30" },
  { category: "Last Week", subject: "Darkness and other portents", matthew: "27:45-53", mark: "15:33-38", luke: "23:44-45" },
  { category: "Last Week", subject: "The burial", matthew: "27:57-61", mark: "15:42-47", luke: "23:50-56", john: "19:38-42" },
  { category: "Resurrection", subject: "SECTION: Resurrection and Ascension", isSection: true },
  { category: "Resurrection", subject: "The resurrection", matthew: "28:1-10", mark: "16:1-11", luke: "24:1-12", john: "20:1-18" },
  { category: "Resurrection", subject: "Disciples going to Emmaus", mark: "16:12-13", luke: "24:13-35" },
  { category: "Resurrection", subject: "Appearances in Jerusalem", mark: "16:14-18", luke: "24:36-49", john: "20:19-29" },
  { category: "Resurrection", subject: "Appearance at sea of Tiberias", john: "21:1-23" },
  { category: "Resurrection", subject: "Appearance on mount of Galilee", matthew: "28:16-20" },
  { category: "Resurrection", subject: "The ascension", mark: "16:19-20", luke: "24:50-53" },
];

const parables: Parable[] = [
  { name: "The Sower", category: "Kingdom", refs: "Matt 13:1-23, Mark 4:1-20, Luke 8:4-15", gospels: ["M", "Mk", "L"], theme: "Reception of the Word", meaning: "The seed is constant, but hearts differ." },
  { name: "Wheat and Tares", category: "Kingdom", refs: "Matt 13:24-30, 36-43", gospels: ["M"], theme: "Good and evil coexist until judgment", meaning: "Final separation belongs to God at the end." },
  { name: "Mustard Seed", category: "Kingdom", refs: "Matt 13:31-32, Mark 4:30-32, Luke 13:18-19", gospels: ["M", "Mk", "L"], theme: "Kingdom grows from small beginnings", meaning: "What begins small under God becomes expansive." },
  { name: "The Leaven", category: "Kingdom", refs: "Matt 13:33, Luke 13:20-21", gospels: ["M", "L"], theme: "Kingdom permeates all things", meaning: "The kingdom works from within and transforms all." },
  { name: "Hidden Treasure", category: "Kingdom", refs: "Matt 13:44", gospels: ["M"], theme: "Worth giving everything for", meaning: "Kingdom value surpasses all earthly gain." },
  { name: "Pearl of Great Price", category: "Kingdom", refs: "Matt 13:45-46", gospels: ["M"], theme: "Incomparable value of the Kingdom", meaning: "True seekers surrender all for Christ's reign." },
  { name: "The Dragnet", category: "Kingdom", refs: "Matt 13:47-50", gospels: ["M"], theme: "Final separation of righteous and wicked", meaning: "Judgment will reveal true and false disciples." },
  { name: "The Ten Virgins", category: "Kingdom", refs: "Matt 25:1-13", gospels: ["M"], theme: "Be ready for the Bridegroom's return", meaning: "Preparedness is proven over time, not panic." },
  { name: "The Talents", category: "Kingdom", refs: "Matt 25:14-30, Luke 19:11-27", gospels: ["M", "L"], theme: "Faithful stewardship of what God gives", meaning: "Faithfulness with entrusted resources reveals loyalty." },
  { name: "Lost Sheep", category: "Grace & Forgiveness", refs: "Matt 18:10-14, Luke 15:4-7", gospels: ["M", "L"], theme: "God seeks the one lost", meaning: "Heaven rejoices over each repentant sinner." },
  { name: "Lost Coin", category: "Grace & Forgiveness", refs: "Luke 15:8-10", gospels: ["L"], theme: "Joy over one sinner who repents", meaning: "God's pursuit is personal and joyful." },
  { name: "Prodigal Son", category: "Grace & Forgiveness", refs: "Luke 15:11-32", gospels: ["L"], theme: "Father's lavish grace to the returning sinner", meaning: "Repentance meets embrace, not probation." },
  { name: "Unmerciful Servant", category: "Grace & Forgiveness", refs: "Matt 18:21-35", gospels: ["M"], theme: "We must forgive as we've been forgiven", meaning: "Received mercy must become offered mercy." },
  { name: "Two Sons", category: "Grace & Forgiveness", refs: "Matt 21:28-32", gospels: ["M"], theme: "Actions matter more than words", meaning: "Obedience demonstrates true repentance." },
  { name: "Great Supper/Wedding Banquet", category: "Grace & Forgiveness", refs: "Matt 22:1-14, Luke 14:15-24", gospels: ["M", "L"], theme: "Many called, few chosen", meaning: "Invitation demands response and transformed life." },
  { name: "Persistent Friend (Importunity)", category: "Prayer", refs: "Luke 11:5-13", gospels: ["L"], theme: "Persist in prayer", meaning: "Keep asking; the Father gives good gifts." },
  { name: "Unjust Judge", category: "Prayer", refs: "Luke 18:1-8", gospels: ["L"], theme: "God answers persistent prayer", meaning: "Do not lose heart in long waiting." },
  { name: "Pharisee and Publican", category: "Prayer", refs: "Luke 18:9-14", gospels: ["L"], theme: "Humble prayer vs. proud prayer", meaning: "Justification comes to the humble, not self-righteous." },
  { name: "Rich Fool", category: "Stewardship", refs: "Luke 12:16-21", gospels: ["L"], theme: "Life is not in possessions", meaning: "Earthly surplus cannot secure eternal life." },
  { name: "Laborers in the Vineyard", category: "Stewardship", refs: "Matt 20:1-16", gospels: ["M"], theme: "Grace, not fairness, governs God's Kingdom", meaning: "God's generosity exceeds human metrics." },
  { name: "Pounds/Minas", category: "Stewardship", refs: "Luke 19:11-27", gospels: ["L"], theme: "Accountability for what's entrusted", meaning: "Kingdom servants answer for entrusted mission." },
  { name: "Unjust Steward", category: "Stewardship", refs: "Luke 16:1-13", gospels: ["L"], theme: "Use present resources wisely for eternity", meaning: "Temporal wealth can serve eternal priorities." },
  { name: "Wicked Husbandmen", category: "Judgment", refs: "Matt 21:33-46, Mark 12:1-12, Luke 20:9-18", gospels: ["M", "Mk", "L"], theme: "Israel's rejection of the Son", meaning: "Rejecting the Son leads to judgment." },
  { name: "Barren Fig Tree", category: "Israel", refs: "Luke 13:6-9", gospels: ["L"], theme: "Israel given time to repent", meaning: "Delay in judgment is mercy meant for repentance." },
  { name: "Rich Man and Lazarus", category: "Judgment", refs: "Luke 16:19-31", gospels: ["L"], theme: "Eternal consequences are real and fixed", meaning: "Present choices carry irreversible eternal weight." },
  { name: "Good Samaritan", category: "Israel", refs: "Luke 10:25-37", gospels: ["L"], theme: "Who is my neighbor?", meaning: "Love crosses social and religious boundaries." },
  { name: "Ten Lepers", category: "Israel", refs: "Luke 17:11-19", gospels: ["L"], theme: "Gratitude and faith", meaning: "Faith returns with gratitude to Christ." },
  { name: "Wise and Foolish Builders", category: "Judgment", refs: "Matt 7:24-27, Luke 6:46-49", gospels: ["M", "L"], theme: "Obedience is the true foundation", meaning: "Hearing without obedience collapses under testing." },
];

const miracles: Miracle[] = [
  { name: "Nobleman's son healed", category: "Healing", refs: "John 4:46-54", blurb: "Jesus heals from a distance by His word." },
  { name: "Demoniac in synagogue", category: "Healing", refs: "Mark 1:21-28, Luke 4:31-37", blurb: "Authority over unclean spirits in public worship." },
  { name: "Peter's mother-in-law", category: "Healing", refs: "Matt 8:14-17, Mark 1:29-34, Luke 4:38-41", blurb: "Immediate restoration leads to service." },
  { name: "Healing a leper", category: "Healing", refs: "Matt 8:1-4, Mark 1:40-45, Luke 5:12-16", blurb: "Compassion and cleansing power touch the unclean." },
  { name: "Paralytic healed", category: "Healing", refs: "Matt 9:1-8, Mark 2:1-12, Luke 5:17-26", blurb: "Jesus forgives sins and heals visible brokenness." },
  { name: "Withered hand", category: "Healing", refs: "Matt 12:9-21, Mark 3:1-12, Luke 6:6-11", blurb: "Mercy outweighs legalistic Sabbath restrictions." },
  { name: "Centurion's servant", category: "Healing", refs: "Matt 8:5-13, Luke 7:1-10", blurb: "Faith in Jesus' authority brings healing." },
  { name: "Blind men healed", category: "Healing", refs: "Matt 9:27-34", blurb: "Persistent faith receives sight." },
  { name: "Woman with issue of blood", category: "Healing", refs: "Matt 9:18-26, Mark 5:21-43, Luke 8:40-56", blurb: "Faith touches Christ and is restored." },
  { name: "Pool of Bethesda", category: "Healing", refs: "John 5:2-15", blurb: "Jesus restores a long-disabled man." },
  { name: "Syrophoenician's daughter", category: "Healing", refs: "Matt 15:21-28, Mark 7:24-30", blurb: "Persistent trust crosses ethnic boundaries." },
  { name: "Deaf and dumb man", category: "Healing", refs: "Mark 7:31-37", blurb: "Jesus opens ears and loosens tongues." },
  { name: "Blind man at Bethsaida", category: "Healing", refs: "Mark 8:22-26", blurb: "A two-stage healing illustrates progressive sight." },
  { name: "Man born blind", category: "Healing", refs: "John 9:1-41", blurb: "Physical and spiritual sight contrasted." },
  { name: "Woman with spirit of infirmity", category: "Healing", refs: "Luke 13:10-17", blurb: "Jesus releases from long bondage on Sabbath." },
  { name: "Man with dropsy", category: "Healing", refs: "Luke 14:1-6", blurb: "Compassion demonstrated in hostile setting." },
  { name: "Ten lepers cleansed", category: "Healing", refs: "Luke 17:11-19", blurb: "One returns in gratitude and faith." },
  { name: "Blind Bartimaeus", category: "Healing", refs: "Matt 20:29-34, Mark 10:46-52, Luke 18:35-43", blurb: "Persistent cry for mercy receives sight." },
  { name: "Malchus' ear restored", category: "Healing", refs: "Luke 22:49-51", blurb: "Grace in the midst of arrest and violence." },
  { name: "Water to wine at Cana", category: "Nature", refs: "John 2:1-11", blurb: "First sign reveals glory and abundance." },
  { name: "Stilling the storm", category: "Nature", refs: "Matt 8:18-27, Mark 4:35-41, Luke 8:22-25", blurb: "Creation obeys its Lord." },
  { name: "Feeding the 5000", category: "Nature", refs: "Matt 14:13-21, Mark 6:30-44, Luke 9:10-17, John 6:1-15", blurb: "Compassion multiplies provision." },
  { name: "Walking on water", category: "Nature", refs: "Matt 14:22-33, Mark 6:45-52, John 6:16-21", blurb: "Jesus' divine authority over chaos." },
  { name: "Feeding the 4000", category: "Nature", refs: "Matt 15:32-39, Mark 8:1-9", blurb: "Sustained mercy for multitudes." },
  { name: "Fish with coin", category: "Nature", refs: "Matt 17:24-27", blurb: "Providence provides exact need." },
  { name: "Fig tree cursed", category: "Nature", refs: "Matt 21:17-22, Mark 11:11-14; 11:19-23", blurb: "Sign-act of fruitless profession judged." },
  { name: "Catch of fish", category: "Nature", refs: "Luke 5:1-11", blurb: "From empty nets to calling disciples." },
  { name: "Second catch of fish", category: "Nature", refs: "John 21:1-23", blurb: "Risen Jesus restores and commissions." },
  { name: "Jairus' daughter", category: "Resurrection", refs: "Matt 9:18-26, Mark 5:21-43, Luke 8:40-56", blurb: "Death yields to Christ's command." },
  { name: "Widow's son at Nain", category: "Resurrection", refs: "Luke 7:11-17", blurb: "Compassion interrupts funeral grief." },
  { name: "Lazarus raised", category: "Resurrection", refs: "John 11:1-44", blurb: "Jesus reveals Himself as resurrection and life." },
  { name: "Demoniac in Capernaum synagogue", category: "Deliverance", refs: "Mark 1:21-28, Luke 4:31-37", blurb: "Unclean spirits submit to Christ." },
  { name: "Gadarene demoniacs", category: "Deliverance", refs: "Matt 8:28-34, Mark 5:1-20, Luke 8:26-39", blurb: "From legion-bound to mission witness." },
  { name: "Blind and dumb demoniac", category: "Deliverance", refs: "Matt 12:22-37, Mark 3:20-30, Luke 11:14-23", blurb: "Kingdom power exposes hardened unbelief." },
  { name: "Lunatic boy", category: "Deliverance", refs: "Matt 17:14-21, Mark 9:14-29, Luke 9:37-42", blurb: "Prayer-dependent faith participates in deliverance." },
];

const lastWeek = [
  {
    day: "SUNDAY — Triumphal Entry",
    refs: "Matt 21:1-11, Mark 11:1-10, Luke 19:29-44, John 12:12-19",
    events: ["Jesus rides donkey into Jerusalem", 'Crowds shout "Hosanna"', "Jesus weeps over Jerusalem"],
  },
  {
    day: "MONDAY — Cleansing the Temple",
    refs: "Matt 21:12-22, Mark 11:11-19",
    events: ["Jesus drives out money changers", "Curses the fig tree", "Chief priests seek to destroy him"],
  },
  {
    day: "TUESDAY — Day of Controversy",
    refs: "Matt 21:23 — 25:46, Mark 11:27 — 13:37, Luke 20:1 — 21:36",
    events: [
      "Authority questioned",
      "Parables of judgment",
      "Woes against Pharisees (Matt 23)",
      "Olivet Discourse (Matt 24-25)",
      "Widow's mite (Mark 12:41-44, Luke 21:1-4)",
    ],
  },
  { day: "WEDNESDAY — Silent Day", refs: "No direct Gospel event sequence recorded", events: ["Quiet transition toward Passover"] },
  {
    day: "THURSDAY — Last Supper & Gethsemane",
    refs: "Matt 26:17-46, Mark 14:12-42, Luke 22:7-46, John 13-17",
    events: ["Preparation of Passover", "Foot washing (John 13)", "Institution of Lord's Supper", "Upper Room discourse (John 14-16)", "High Priestly Prayer (John 17)", "Gethsemane"],
  },
  {
    day: "FRIDAY — Crucifixion",
    refs: "Matt 27, Mark 15, Luke 23, John 18-19",
    events: ["Morning trials before Pilate and Herod", "9:00 AM crucifixion begins", "12:00 PM darkness", '3:00 PM "It is finished"', "Evening burial in Joseph's tomb"],
  },
  { day: "SATURDAY — In the Tomb (Sabbath)", refs: "Matt 27:62-66", events: ["Tomb sealed and guarded"] },
  {
    day: "SUNDAY — Resurrection!",
    refs: "Matt 28:1-10, Mark 16:1-11, Luke 24:1-12, John 20:1-18",
    events: ["Empty tomb discovered", "Mary Magdalene sees risen Jesus", "Peter and John run to the tomb", "Angels announce resurrection"],
  },
];

const appearances = [
  ["Mary Magdalene at the tomb", "John 20:11-18"],
  ["Other women", "Matt 28:9-10"],
  ["Peter (alone)", "Luke 24:34, 1 Cor 15:5"],
  ["Two disciples on Emmaus road", "Luke 24:13-35, Mark 16:12-13"],
  ["Ten disciples (Thomas absent)", "Luke 24:36-43, John 20:19-25"],
  ["Eleven disciples (Thomas present)", "John 20:26-31"],
  ["Seven disciples at Sea of Tiberias", "John 21:1-23"],
  ["Five hundred brethren at once", "1 Cor 15:6"],
  ["James (the Lord's brother)", "1 Cor 15:7"],
  ["Eleven on mountain in Galilee", "Matt 28:16-20, Mark 16:15-18"],
  ["The Ascension", "Mark 16:19-20, Luke 24:50-53, Acts 1:9-12"],
] as const;

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("revealed");
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function RefCell({ text, onOpen }: { text?: string; onOpen: (t: string) => void }) {
  if (!text) return <span className="opacity-35">—</span>;
  return (
    <button className="underline decoration-dotted underline-offset-2 hover:text-[#c9a227]" onClick={() => onOpen(text)}>
      {text}
    </button>
  );
}

export function FourGospelsStudyPage() {
  useReveal();
  const [harmonyFilter, setHarmonyFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [refPopover, setRefPopover] = useState<string | null>(null);
  const [parableFilter, setParableFilter] = useState("All");
  const [miracleFilter, setMiracleFilter] = useState("All");
  const [miracleView, setMiracleView] = useState<"grid" | "table">("grid");

  useEffect(() => {
    const prevBody = document.body.style.backgroundColor;
    const prevRoot = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#0d1117";
    document.body.style.backgroundColor = "#0d1117";
    return () => {
      document.documentElement.style.backgroundColor = prevRoot;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);

  const filteredHarmony = useMemo(() => {
    const q = search.trim().toLowerCase();
    return harmonyRows.filter((r) => {
      const byFilter = harmonyFilter === "All" || r.category === harmonyFilter || r.isSection;
      if (!byFilter) return false;
      if (!q) return true;
      return [r.subject, r.matthew, r.mark, r.luke, r.john].some((x) => (x ?? "").toLowerCase().includes(q));
    });
  }, [harmonyFilter, search]);

  const filteredParables = useMemo(
    () => parables.filter((p) => parableFilter === "All" || p.category === parableFilter),
    [parableFilter],
  );
  const filteredMiracles = useMemo(
    () => miracles.filter((m) => miracleFilter === "All" || m.category === miracleFilter),
    [miracleFilter],
  );

  return (
    <div className="gospel-page min-h-[100dvh] w-full bg-[#0d1117] text-[#e8dcc8]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=EB+Garamond:wght@400;500;700&display=swap');
        .gospel-page{background:#0d1117;color:#e8dcc8;font-family:"EB Garamond",serif;scroll-behavior:smooth}
        .gospel-page header,.gospel-page nav,.gospel-page main,.gospel-page section{background:#0d1117}
        .g-header{font-family:"Cinzel",serif}
        .gold{color:#c9a227}
        .surface{background:radial-gradient(circle at 1px 1px, rgba(201,162,39,.07) 1px, rgba(255,255,255,0) 0), #121821;background-size:14px 14px;border:1px solid rgba(201,162,39,.2)}
        .reveal{opacity:0;transform:translateY(16px);transition:all .5s ease}
        .reveal.revealed{opacity:1;transform:translateY(0)}
      `}</style>

      <header className="border-b border-[#c9a22733] px-4 py-10 text-center">
        <h1 className="g-header text-4xl font-bold text-[#e8dcc8] sm:text-5xl">The Four Gospels</h1>
        <p className="mt-3 text-lg text-[#c9a227]">Matthew • Mark • Luke • John</p>
        <div className="mx-auto mt-8 max-w-6xl overflow-x-auto px-2 pb-4">
          <div className="relative min-w-[60rem]">
            <div className="h-2 rounded-full bg-[#c9a22766]" />
            <div className="mt-3 grid grid-cols-8 text-center text-xs">
              {["Birth", "Baptism 26 AD", "First Year 27 AD", "Galilean Ministry 28 AD", "Second Year 29 AD", "Crucifixion 30 AD", "Resurrection", "Ascension"].map(
                (label) => (
                  <div key={label} className="relative pt-3">
                    <span className="absolute left-1/2 top-[-18px] h-5 w-[2px] -translate-x-1/2 bg-[#c9a227]" />
                    {label}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b border-[#c9a22722] bg-[#0d1117ee] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-3 py-3">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-[#c9a22744] px-3 py-1 text-xs hover:bg-[#c9a22722]">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-10">
        <section id="timeline-overview" data-reveal className="reveal">
          <h2 className="g-header text-3xl gold">1. Timeline Overview</h2>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
            {periodCards.map((c) => (
              <article key={c.title} className="surface min-w-[19rem] rounded-xl p-4">
                <h3 className="g-header text-lg">{c.title}</h3>
                <ul className="mt-3 space-y-1 text-sm">
                  {c.points.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="harmony" data-reveal className="reveal">
          <h2 className="g-header text-3xl gold">2. Harmony of the Gospels</h2>
          <div className="surface mt-4 rounded-xl p-4">
            <div className="flex flex-wrap gap-2">
              {["All", "Birth & Early Life", "Baptism", "Temptation", "Early Ministry", "Miracles", "Parables", "Jerusalem Ministry", "Last Week", "Resurrection"].map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setHarmonyFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs ${harmonyFilter === f ? "bg-[#c9a227] text-[#0d1117]" : "border border-[#c9a22755]"}`}
                  >
                    {f}
                  </button>
                ),
              )}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rows..."
                className="ml-auto min-w-[12rem] rounded border border-[#c9a22755] bg-transparent px-2 py-1 text-xs"
              />
            </div>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[64rem] border-collapse text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="border-b border-[#c9a22755] p-2">Subject</th>
                    <th className="border-b border-[#4a90d9aa] p-2 text-[#4a90d9]">Matthew</th>
                    <th className="border-b border-[#e85d2faa] p-2 text-[#e85d2f]">Mark</th>
                    <th className="border-b border-[#4caf7daa] p-2 text-[#4caf7d]">Luke</th>
                    <th className="border-b border-[#9b59b6aa] p-2 text-[#9b59b6]">John</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHarmony.map((r) =>
                    r.isSection ? (
                      <tr key={r.subject}>
                        <td colSpan={5} className="bg-[#c9a2271f] p-2 font-semibold">
                          {r.subject}
                        </td>
                      </tr>
                    ) : (
                      <tr key={`${r.category}-${r.subject}`} className="align-top">
                        <td className="border-b border-[#ffffff14] p-2">{r.subject}</td>
                        <td className="border-b border-[#ffffff14] p-2"><RefCell text={r.matthew} onOpen={setRefPopover} /></td>
                        <td className="border-b border-[#ffffff14] p-2"><RefCell text={r.mark} onOpen={setRefPopover} /></td>
                        <td className="border-b border-[#ffffff14] p-2"><RefCell text={r.luke} onOpen={setRefPopover} /></td>
                        <td className="border-b border-[#ffffff14] p-2"><RefCell text={r.john} onOpen={setRefPopover} /></td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="sermon" data-reveal className="reveal">
          <h2 className="g-header text-3xl gold">3. The Sermon on the Mount</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="surface sticky top-20 h-fit rounded-xl p-3">
              {["The Setting", "The Beatitudes", "Salt and Light", "The Law Fulfilled", "Six Contrasts", "Righteous Acts Done Privately", "Kingdom Priorities", "Judgment and Wisdom"].map(
                (t) => (
                  <a key={t} href={`#sermon-${t.replace(/\s+/g, "-").toLowerCase()}`} className="block rounded px-2 py-1 text-sm hover:bg-[#c9a22722]">
                    {t}
                  </a>
                ),
              )}
            </aside>
            <div className="space-y-4">
              <article id="sermon-the-setting" className="surface rounded-xl p-4">
                <h3 className="g-header text-xl">The Setting</h3>
                <p className="mt-2 text-sm">Where: Mountain near Capernaum • Audience: Disciples + multitudes • References: Matt 5:1-2, Luke 6:17-20</p>
              </article>
              <article id="sermon-the-beatitudes" className="surface rounded-xl p-4">
                <h3 className="g-header text-xl">The Beatitudes (Matt 5:3-12, Luke 6:20-26)</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    "Poor in spirit -> Kingdom of Heaven",
                    "Those who mourn -> Shall be comforted",
                    "The meek -> Shall inherit the earth",
                    "Hunger & thirst for righteousness -> Shall be filled",
                    "The merciful -> Shall obtain mercy",
                    "Pure in heart -> Shall see God",
                    "The peacemakers -> Called sons of God",
                    "Persecuted for righteousness -> Kingdom of Heaven",
                  ].map((b) => (
                    <div key={b} className="rounded border border-[#c9a22744] bg-[#ffffff08] p-3 text-sm">
                      {b}
                    </div>
                  ))}
                </div>
              </article>
              <article id="sermon-salt-and-light" className="surface rounded-xl p-4"><h3 className="g-header text-xl">Salt and Light (Matt 5:13-16)</h3></article>
              <article id="sermon-the-law-fulfilled" className="surface rounded-xl p-4"><h3 className="g-header text-xl">The Law Fulfilled (Matt 5:17-20)</h3></article>
              <article id="sermon-six-contrasts" className="surface rounded-xl p-4">
                <h3 className="g-header text-xl">Six Contrasts — "You have heard... But I say"</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {["Murder -> Anger", "Adultery -> Lust", "Divorce -> Certificate requirement", "Oaths -> Let yes be yes", "Eye for eye -> Turn other cheek", "Love neighbor -> Love enemies"].map(
                    (c) => (
                      <div key={c} className="rounded border border-[#c9a22744] p-3 text-sm">
                        {c}
                      </div>
                    ),
                  )}
                </div>
              </article>
              <article id="sermon-righteous-acts-done-privately" className="surface rounded-xl p-4">
                <h3 className="g-header text-xl">Righteous Acts Done Privately (Matt 6:1-18)</h3>
                <p className="mt-2 text-sm">Giving (6:1-4) • Prayer (6:5-15) • Fasting (6:16-18)</p>
                <blockquote className="mt-3 rounded border-l-4 border-[#c9a227] bg-[#ffffff0a] p-3 text-sm italic">
                  Our Father in heaven, hallowed be your name... For yours is the kingdom and the power and the glory forever. Amen.
                </blockquote>
              </article>
              <article id="sermon-kingdom-priorities" className="surface rounded-xl p-4"><h3 className="g-header text-xl">Kingdom Priorities (Matt 6:19-34)</h3></article>
              <article id="sermon-judgment-and-wisdom" className="surface rounded-xl p-4">
                <h3 className="g-header text-xl">Judgment and Wisdom (Matt 7)</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Do not judge (7:1-5)</li><li>• Pearls before swine (7:6)</li><li>• Ask, Seek, Knock (7:7-11)</li><li>• Golden Rule (7:12)</li><li>• Narrow and wide gate (7:13-14)</li><li>• False prophets (7:15-23)</li><li>• Wise and foolish builders (7:24-27)</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="parables" data-reveal className="reveal">
          <h2 className="g-header text-3xl gold">4. The Parables</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["All", "Kingdom", "Grace & Forgiveness", "Prayer", "Stewardship", "Judgment", "Israel"].map((f) => (
              <button key={f} onClick={() => setParableFilter(f)} className={`rounded-full px-3 py-1 text-xs ${parableFilter === f ? "bg-[#c9a227] text-[#0d1117]" : "border border-[#c9a22755]"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredParables.map((p) => (
              <details key={p.name} className="surface rounded-xl p-4">
                <summary className="cursor-pointer list-none">
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-1 text-xs text-[#c9a227]">{p.refs}</p>
                  <p className="mt-1 text-xs">{p.theme}</p>
                  <div className="mt-2 flex gap-1 text-[10px]">
                    {p.gospels.map((g) => (
                      <span key={g} className="rounded border border-[#c9a22766] px-1.5 py-0.5">{g}</span>
                    ))}
                  </div>
                </summary>
                <p className="mt-3 text-sm">{p.meaning}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="miracles" data-reveal className="reveal">
          <h2 className="g-header text-3xl gold">5. The Miracles</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {["All", "Healing", "Nature", "Resurrection", "Deliverance"].map((f) => (
              <button key={f} onClick={() => setMiracleFilter(f)} className={`rounded-full px-3 py-1 text-xs ${miracleFilter === f ? "bg-[#c9a227] text-[#0d1117]" : "border border-[#c9a22755]"}`}>
                {f}
              </button>
            ))}
            <div className="ml-auto flex gap-1 rounded border border-[#c9a22755] p-1 text-xs">
              <button className={miracleView === "grid" ? "bg-[#c9a227] px-2 text-[#0d1117]" : "px-2"} onClick={() => setMiracleView("grid")}>Grid</button>
              <button className={miracleView === "table" ? "bg-[#c9a227] px-2 text-[#0d1117]" : "px-2"} onClick={() => setMiracleView("table")}>Table</button>
            </div>
          </div>
          {miracleView === "grid" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMiracles.map((m) => (
                <article key={m.name} className="surface rounded-xl p-4">
                  <p className="font-semibold">{m.name}</p>
                  <p className="mt-1 text-xs gold">{m.category}</p>
                  <p className="mt-1 text-xs">{m.refs}</p>
                  <p className="mt-2 text-sm">{m.blurb}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 overflow-auto">
              <table className="surface w-full min-w-[52rem] rounded-xl text-sm">
                <thead>
                  <tr><th className="p-2 text-left">Miracle</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">References</th><th className="p-2 text-left">Description</th></tr>
                </thead>
                <tbody>
                  {filteredMiracles.map((m) => (
                    <tr key={m.name} className="border-t border-[#ffffff14]">
                      <td className="p-2">{m.name}</td><td className="p-2">{m.category}</td><td className="p-2">{m.refs}</td><td className="p-2">{m.blurb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="last-week" data-reveal className="reveal">
          <h2 className="g-header text-3xl gold">6. The Last Week</h2>
          <div className="mt-5 space-y-4 border-l-2 border-[#c9a22766] pl-4">
            {lastWeek.map((d) => (
              <article key={d.day} className="surface rounded-xl p-4">
                <h3 className="g-header text-xl">{d.day}</h3>
                <p className="mt-1 text-xs gold">{d.refs}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {d.events.map((e) => (
                    <li key={e}>• {e}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="resurrection" data-reveal className="reveal">
          <h2 className="g-header text-3xl gold">7. Resurrection & Ascension</h2>
          <div className="mt-5 space-y-3">
            {appearances.map(([event, refs], i) => (
              <article key={event} className="surface rounded-xl p-4">
                <p className="font-semibold">{i + 1}. {event}</p>
                <p className="mt-1 text-xs gold">{refs}</p>
              </article>
            ))}
          </div>
          <blockquote className="surface mt-6 rounded-xl border-l-4 border-[#c9a227] p-5 text-lg italic">
            "All authority in heaven and on earth has been given to me. Go therefore and make disciples of all nations... and behold, I am with you always, to the end of the age." (Matt 28:18-20)
          </blockquote>
        </section>
      </main>

      {refPopover ? (
        <div className="fixed bottom-4 right-4 z-40 max-w-xs rounded-lg border border-[#c9a22777] bg-[#121821] p-3 text-sm shadow-2xl">
          <p className="text-xs uppercase tracking-wider gold">Scripture Reference</p>
          <p className="mt-1">{refPopover}</p>
          <button className="mt-2 text-xs underline" onClick={() => setRefPopover(null)}>Close</button>
        </div>
      ) : null}
    </div>
  );
}

