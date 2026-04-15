export type ReaderBookOutline = {
  title: string;
  dateLabel?: string;
  teacher?: string;
  etymology?: string[];
  author?: string[];
  dateOfWriting?: string[];
  historicalBackground?: string[];
  thematicOutline?: string[];
  keyReferences?: string[];
};

export const READER_BOOK_OUTLINES: Record<string, ReaderBookOutline> = {
  Genesis: {
    title: "Genesis",
    dateLabel: "January 26, 2006",
    teacher: "Pastor Hong Jeong-hyeon",
    author: [
      "One of the five books of the Pentateuch written by Moses under the inspiration of the Holy Spirit.",
      "Though Moses did not witness Genesis events directly, Scripture presents Mosaic authorship as Spirit-led testimony.",
    ],
    dateOfWriting: ["Not explicitly provided in source notes."],
    historicalBackground: ["Not explicitly provided in source notes."],
    thematicOutline: [
      "1. Creation (Chapters 1-2)",
      "2. Adam and His Family (Chapters 3-5)",
      "3. Noah and His Family (Chapters 6-11)",
      "4. Abraham (12:1-25:18)",
      "5. Isaac (25:19-26:35)",
      "6. Jacob (27:1-36:43)",
      "7. Joseph (37:1-50:26)",
    ],
    keyReferences: ["2 Peter 1:20-21", "Mark 12:26", "John 5:46-47"],
  },
  Exodus: {
    title: "Exodus",
    dateLabel: "February 23, 2006",
    teacher: "Pastor Yang Sang-yong",
    author: ["Moses is identified as the author."],
    dateOfWriting: ["Not explicitly provided in source notes."],
    historicalBackground: [
      "Second book of the Pentateuch, continuing from Genesis.",
      "Describes God's deliverance of Israel from Pharaoh's bondage in Egypt.",
    ],
    thematicOutline: [
      "Part 1: The Exodus (Ch. 1-18) - oppression, Moses' preparation, plagues, Passover, deliverance, wilderness protection.",
      "Part 2: Covenant and Law (Ch. 19-40) - Sinai covenant, Ten Commandments, ordinances, tabernacle blueprint, covenant breach/renewal, tabernacle construction, glory filling the tabernacle.",
    ],
    keyReferences: ["Luke 24:25-27"],
  },
  Leviticus: {
    title: "Leviticus",
    dateLabel: "March 16, 2006",
    teacher: "Pastor Seo Do-seok",
    etymology: [
      "Hebrew: Wayyiqra (And He called).",
      "Traditional title Leviticus follows Septuagint/Vulgate influence.",
    ],
    author: [
      "Repeated formula 'The LORD said to Moses' indicates Mosaic recording under divine inspiration.",
      "Presented as part of the Book of Moses.",
    ],
    dateOfWriting: ["Not explicitly provided in source notes."],
    historicalBackground: [
      "Key themes: separation and holiness.",
      "Leviticus teaches covenant people how to approach a holy God through holiness, sanctification, and redemption.",
      "Ceremonial laws are fulfilled in Christ, yet their spiritual principles remain vital for believers.",
    ],
    thematicOutline: [
      "1. How to Approach the Holy God (1:1-16:34)",
      "2. How Humanity Fellowships with God (17:1-25:55)",
      "3. Application of the Law (26:1-27:34)",
    ],
  },
  Numbers: {
    title: "Numbers",
    dateLabel: "April 27, 2006",
    teacher: "Pastor Kim Sang-hoe",
    etymology: [
      "Greek/Septuagint title means Numbers (census record).",
      "Hebrew Bemidbar means In the wilderness.",
    ],
    author: [
      "Presented as Mosaic authorship, with repeated statements of divine speech to Moses.",
    ],
    dateOfWriting: [
      "Attributed to Moses during wilderness leadership years, especially later in life.",
    ],
    historicalBackground: [
      "Records Israel's wilderness period from Sinai departure to Moab plains (approximately 40 years, including 38 years of delayed wandering).",
      "Highlights both judgment on rebellion and God's preserving grace in raising a new generation.",
      "Frames wilderness history as instruction: life and blessing flow from trusting and obeying God.",
    ],
    thematicOutline: [
      "Part 1 (1:1-10:10): First generation prepared for the march.",
      "Part 2 (10:11-25:18): Rebellion at Kadesh Barnea and 38 years of wandering.",
      "Part 3 (26:1-36:13): New generation prepared for conquest and inheritance.",
    ],
  },
  Deuteronomy: {
    title: "Deuteronomy",
    dateLabel: "May 11, 2006",
    teacher: "Pastor Hong Jeong-hyeon",
    etymology: [
      "Hebrew title means The Words.",
      "Deuteronomy derives from Greek for second law.",
    ],
    author: [
      "Presented as Moses' farewell teaching to the second generation before entering Canaan.",
    ],
    dateOfWriting: ["Not explicitly provided in source notes."],
    historicalBackground: ["Not explicitly provided in source notes."],
    thematicOutline: [
      "1. Past Failures and Future Promises (Ch. 1-4)",
      "2. The Ten Commandments (Ch. 5-11)",
      "3. Civil Law (Ch. 12-16)",
      "4. Criminal Law (Ch. 17-20)",
      "5. Social Law (Ch. 21-26)",
      "6. Promise of Blessings and Curses (Ch. 27-30)",
      "7. Moses' Farewell Address and Death (Ch. 31-34)",
    ],
  },
  Joshua: {
    title: "Joshua",
    dateLabel: "June 29, 2006",
    teacher: "Pastor Seo Do-seok",
    etymology: [
      "Named for Joshua son of Nun, leader of conquest and settlement.",
    ],
    author: [
      "Major portions attributed to Joshua himself.",
      "Later Spirit-guided additions likely completed by later prophetic historians.",
    ],
    dateOfWriting: [
      "Main portions dated near end of Joshua's life (around 1390 BC) with later additions before final completion.",
    ],
    historicalBackground: [
      "Written to show God's fulfillment of promise to give Canaan and to emphasize conquest by God's faithfulness, not Israel's strength.",
      "Also serves as warning backdrop for failures that emerged in Judges era.",
      "Typologically points forward to Jesus and the church's faithful pilgrimage.",
    ],
    thematicOutline: ["Not separately provided in source notes."],
  },
  Judges: {
    title: "Judges",
    dateLabel: "July 13, 2006",
    teacher: "Pastor Yang Sang-yong",
    etymology: ["Judge refers to leader governing spiritual, political, and judicial life."],
    author: ["Attributed to Samuel or his prophetic circle."],
    dateOfWriting: ["Before David drove out the Jebusites from Jerusalem (per source note)."],
    historicalBackground: ["Covers roughly post-Joshua to Saul's enthronement (about 350 years in source note)."],
    thematicOutline: [
      "1. National decline and incomplete conquest (1:1-3:6)",
      "2. Deeds of twelve judges and repeated deliverance (3:7-16:31)",
      "3. Moral corruption, tribal division, and idolatry (17:1-21:25)",
    ],
  },
  Ruth: {
    title: "Ruth",
    dateLabel: "August 24, 2006",
    teacher: "Pastor Kim Chang-gyu",
    etymology: ["Named after Ruth; Hebrew sense includes female friend."],
    author: [
      "Exact author unknown; source suggests a prophetic writer in Samuel's tradition is plausible.",
    ],
    dateOfWriting: ["Not explicitly provided in source notes."],
    historicalBackground: [
      "Highlights God's providence behind Davidic kingship and ultimately Messiah's lineage.",
      "Shows inclusion of repentant foreigners (Ruth, alongside Rahab in wider biblical witness) within redemptive history.",
      "Calls readers to see more than a personal story: the covenantal plan of God.",
    ],
    thematicOutline: ["Not separately provided in source notes."],
  },
  "1 Samuel": {
    title: "1 Samuel",
    dateLabel: "September 21, 2006",
    teacher: "Pastor Choi Hun-il",
    etymology: ["1 and 2 Samuel are named after Samuel."],
    author: [
      "Exact authorship uncertain; source notes propose Samuel for early portions and later prophetic completion for remaining material.",
    ],
    dateOfWriting: ["Not explicitly provided in source notes."],
    historicalBackground: [
      "Spans transition from late Judges period to monarchy.",
      "Records Samuel's role, Saul's failure, David's anointing, and David's formative trials.",
    ],
    thematicOutline: [
      "1. Birth and Childhood (Ch. 1-2)",
      "2. Calling and Ministry (Ch. 3)",
      "3. His Era and Activities (Ch. 4-7)",
      "4. Appointed as King (Ch. 8-10)",
      "5. A Promising Start (Ch. 11)",
      "6. Foolishness and Sin (Ch. 12-15)",
      "7. Anointed by Samuel (16:1-13)",
      "8. Serving as Saul's Attendant (16:14-20)",
      "9. Years as a Fugitive / Refinement (Ch. 21-30)",
      "10. The Death of Saul (Ch. 31)",
    ],
  },
};

export function getReaderBookOutline(book: string): ReaderBookOutline | null {
  return READER_BOOK_OUTLINES[book] ?? null;
}

