export type StudyScriptureRef = {
  label: string;
  book: string;
  chapter: number;
};

export type StudyTopic = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  chartPoints: string[];
  scriptures: StudyScriptureRef[];
};

export type StudySection = {
  id: string;
  title: string;
  span: string;
  topics: StudyTopic[];
};

export const STUDY_SECTIONS: StudySection[] = [
  {
    id: "beginning",
    title: "Beginning of All Things",
    span: "Genesis 1-11",
    topics: [
      {
        id: "creation-universe",
        title: "Creation of Universe & Earth",
        summary: "God creates all things by His word and establishes order, purpose, and blessing.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/62/Le_Creazione_di_Adamo%2C_Michelangelo.jpg",
        chartPoints: ["God speaks -> creation appears", "Light, life, and order increase day by day", "Creation culminates in Sabbath rest"],
        scriptures: [
          { label: "Genesis 1", book: "Genesis", chapter: 1 },
          { label: "Genesis 2:1-3", book: "Genesis", chapter: 2 },
        ],
      },
      {
        id: "flood-noah",
        title: "The Flood (Noah)",
        summary: "Judgment and mercy meet as God preserves Noah and renews covenant grace.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Noah%27s_Ark_-_Edward_Hicks_1846.jpg",
        chartPoints: ["Human wickedness rises", "Judgment by flood", "Ark salvation and covenant sign"],
        scriptures: [
          { label: "Genesis 6-9", book: "Genesis", chapter: 6 },
          { label: "Genesis 9:8-17", book: "Genesis", chapter: 9 },
        ],
      },
      {
        id: "babel",
        title: "Tower of Babel (Nations Formed)",
        summary: "Human pride seeks unity without God; God scatters and forms the nations.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/34/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project.jpg",
        chartPoints: ["One language and one project", "Prideful self-exaltation", "Confusion, scattering, and nations"],
        scriptures: [{ label: "Genesis 11:1-9", book: "Genesis", chapter: 11 }],
      },
    ],
  },
  {
    id: "patriarchs",
    title: "Patriarchs & Promise",
    span: "Genesis 12-50",
    topics: [
      {
        id: "abrahamic-promise",
        title: "Abraham, Isaac, Jacob",
        summary: "God's covenant promise moves through the patriarchal line by grace and faith.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Jose_de_Ribera_022.jpg",
        chartPoints: ["Call and covenant to Abraham", "Promise carried through Isaac", "Israel formed through Jacob"],
        scriptures: [
          { label: "Genesis 12", book: "Genesis", chapter: 12 },
          { label: "Genesis 15", book: "Genesis", chapter: 15 },
          { label: "Genesis 28", book: "Genesis", chapter: 28 },
        ],
      },
      {
        id: "joseph-providence",
        title: "Joseph",
        summary: "God's providence turns betrayal into preservation for His covenant people.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/34/Antonio_Maria_Vassallo_-_Joseph_Explaining_Dreams.jpg",
        chartPoints: ["Betrayed into Egypt", "Raised to authority", "Family preserved during famine"],
        scriptures: [
          { label: "Genesis 37", book: "Genesis", chapter: 37 },
          { label: "Genesis 41", book: "Genesis", chapter: 41 },
          { label: "Genesis 50:20", book: "Genesis", chapter: 50 },
        ],
      },
    ],
  },
  {
    id: "redemption-law",
    title: "Redemption & Law",
    span: "Exodus-Deuteronomy",
    topics: [
      {
        id: "exodus-law",
        title: "Moses, Exodus, and the Law",
        summary: "God redeems His people, gives His law, and forms a holy covenant nation.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/76/Moses_striking_the_rock%2C_1682.jpg",
        chartPoints: ["Deliverance from Egypt", "Sinai covenant and commandments", "Tabernacle-centered worship"],
        scriptures: [
          { label: "Exodus 12", book: "Exodus", chapter: 12 },
          { label: "Exodus 20", book: "Exodus", chapter: 20 },
          { label: "Leviticus 23", book: "Leviticus", chapter: 23 },
        ],
      },
    ],
  },
  {
    id: "kingdom-failure",
    title: "Kingdom & Failure",
    span: "Joshua-Esther",
    topics: [
      {
        id: "conquest-kings-exile-return",
        title: "Conquest, Kings, Exile, Return",
        summary: "Israel's story cycles through conquest, compromise, collapse, and restoration.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/David_and_Goliath_by_Caravaggio.jpg",
        chartPoints: ["Conquest and settlement", "United then divided monarchy", "Exile and post-exilic return"],
        scriptures: [
          { label: "Joshua 1", book: "Joshua", chapter: 1 },
          { label: "2 Samuel 7", book: "2 Samuel", chapter: 7 },
          { label: "2 Kings 25", book: "2 Kings", chapter: 25 },
          { label: "Ezra 1", book: "Ezra", chapter: 1 },
        ],
      },
    ],
  },
  {
    id: "prophets",
    title: "Prophets & Prophecy",
    span: "Isaiah-Malachi",
    topics: [
      {
        id: "prophetic-perspective",
        title: "Near vs Far Prophecy",
        summary: "Prophecy often has layered horizons: immediate fulfillment and future kingdom hope.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/66/Isaiah%2C_Michelangelo_Buonarroti_31.jpg",
        chartPoints: ["Warning and judgment for covenant breach", "Messianic promise amid crisis", "Mountain peaks: near and distant fulfillments"],
        scriptures: [
          { label: "Isaiah 7", book: "Isaiah", chapter: 7 },
          { label: "Isaiah 53", book: "Isaiah", chapter: 53 },
          { label: "Daniel 9", book: "Daniel", chapter: 9 },
        ],
      },
    ],
  },
  {
    id: "first-coming",
    title: "Jesus Christ - First Coming",
    span: "Gospels",
    topics: [
      {
        id: "gospels-kingdom",
        title: "Birth, Ministry, Cross, Resurrection",
        summary: "Jesus reveals the kingdom, fulfills Scripture, and secures redemption by His death and resurrection.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Christ_Pantocrator_mosaic_from_Hagia_Sophia.jpg",
        chartPoints: ["Incarnation and announcement", "Kingdom teaching and signs", "Cross, empty tomb, and Great Commission"],
        scriptures: [
          { label: "Matthew 1", book: "Matthew", chapter: 1 },
          { label: "Mark 1", book: "Mark", chapter: 1 },
          { label: "Luke 24", book: "Luke", chapter: 24 },
          { label: "John 20", book: "John", chapter: 20 },
        ],
      },
    ],
  },
  {
    id: "church-age",
    title: "The Church Age",
    span: "Acts-Jude",
    topics: [
      {
        id: "church-birth-mission",
        title: "Birth and Expansion of the Church",
        summary: "The Spirit empowers the church to spread the gospel and build believers in doctrine and life.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/89/Pentecost_El_Greco.jpg",
        chartPoints: ["Pentecost and church birth", "Mission from Jerusalem outward", "Apostolic doctrine and Christian living"],
        scriptures: [
          { label: "Acts 2", book: "Acts", chapter: 2 },
          { label: "Acts 13", book: "Acts", chapter: 13 },
          { label: "Ephesians 2", book: "Ephesians", chapter: 2 },
        ],
      },
    ],
  },
  {
    id: "end-times",
    title: "The End Times",
    span: "Revelation 1-19",
    topics: [
      {
        id: "tribulation-conflict",
        title: "Seven Churches, Tribulation, Antichrist",
        summary: "Revelation unveils Christ's lordship over history and the climactic conflict before His return.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Apocalypse_vasnetsov.jpg",
        chartPoints: ["Messages to seven churches", "Tribulation judgments unfold", "Beast powers and global deception"],
        scriptures: [
          { label: "Revelation 2-3", book: "Revelation", chapter: 2 },
          { label: "Revelation 6", book: "Revelation", chapter: 6 },
          { label: "Revelation 13", book: "Revelation", chapter: 13 },
        ],
      },
    ],
  },
  {
    id: "kingdom",
    title: "The Kingdom",
    span: "Revelation 20",
    topics: [
      {
        id: "millennial-reign",
        title: "Millennial Reign",
        summary: "Satan is bound and Christ reigns; then comes final rebellion and decisive judgment.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/05/Gustave_Dor%C3%A9_-_The_New_Jerusalem.jpg",
        chartPoints: ["Satan bound for 1000 years", "Saints reign with Christ", "Final rebellion crushed"],
        scriptures: [{ label: "Revelation 20:1-10", book: "Revelation", chapter: 20 }],
      },
    ],
  },
  {
    id: "eternity",
    title: "Final Judgment & Eternity",
    span: "Revelation 20-22",
    topics: [
      {
        id: "white-throne-new-creation",
        title: "Great White Throne, New Creation, Holy City",
        summary: "God judges evil fully and ushers in the new heaven, new earth, and New Jerusalem.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/80/John_Martin_-_The_Great_Day_of_His_Wrath.jpg",
        chartPoints: ["Great White Throne judgment", "Second resurrection", "New heaven and new earth"],
        scriptures: [
          { label: "Revelation 20:11-15", book: "Revelation", chapter: 20 },
          { label: "Revelation 21", book: "Revelation", chapter: 21 },
          { label: "Revelation 22", book: "Revelation", chapter: 22 },
        ],
      },
    ],
  },
];
