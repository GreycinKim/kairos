import { useEffect, useMemo, useState } from "react";

type Feast = {
  id: number;
  name: string;
  hebrew: string;
  date: string;
  scripture: string;
  season: "spring" | "autumn";
  status: "FULFILLED" | "AWAITING FULFILLMENT";
  historical: string;
  messianic: string;
  personal: string;
  keyVerses: string[];
  larkinNote?: string;
};

type Offering = {
  id: number;
  name: string;
  category: "Sweet Savor" | "Sin Offering";
  scripture: string;
  what: string;
  offerer: string;
  priest: string;
  godPortion: string;
  priestPortion: string;
  symbolism: string;
  christ: string;
  personal: string;
  keyVerse: string;
  steps: string[];
};

const feasts: Feast[] = [
  {
    id: 1,
    name: "Passover",
    hebrew: "Pesach",
    date: "Nisan 14",
    scripture: "Leviticus 23:5, Exodus 12",
    season: "spring",
    status: "FULFILLED",
    historical: "Freedom from Egypt by the blood of the lamb on the doorposts.",
    messianic: "Jesus crucified on Passover as the Lamb of God; fulfilled to the day (1 Cor 5:7).",
    personal: "Redemption from sin and death through faith in Christ's blood.",
    keyVerses: ["Exodus 12:13", "John 1:29", "1 Corinthians 5:7"],
    larkinNote: "The blood of the Passover lamb typified the blood of Christ at Calvary.",
  },
  {
    id: 2,
    name: "Unleavened Bread",
    hebrew: "Hag Hamatzot",
    date: "Nisan 15-22",
    scripture: "Leviticus 23:6-8",
    season: "spring",
    status: "FULFILLED",
    historical: "Israel left in haste with unleavened bread; leaven symbolized corruption.",
    messianic: "Christ's sinless body in burial; He is the Bread of Life.",
    personal: "Sanctification: put away leaven of malice and wickedness.",
    keyVerses: ["1 Corinthians 5:6-8", "John 6:35", "2 Corinthians 5:21"],
  },
  {
    id: 3,
    name: "Firstfruits",
    hebrew: "Hag HaBikkurim",
    date: "Nisan 16/17",
    scripture: "Leviticus 23:9-14",
    season: "spring",
    status: "FULFILLED",
    historical: "First sheaf of barley waved before the Lord.",
    messianic: "Christ rose the first day of the week as firstfruits of resurrection.",
    personal: "Consecration and newness of life in resurrection power.",
    keyVerses: ["1 Corinthians 15:20-23", "Romans 6:4", "2 Corinthians 5:17"],
  },
  {
    id: 4,
    name: "Pentecost / Weeks",
    hebrew: "Shavuot",
    date: "Sivan 6 (50 days)",
    scripture: "Leviticus 23:15-22",
    season: "spring",
    status: "FULFILLED",
    historical: "Wheat harvest; remembrance of Law at Sinai; two leavened loaves.",
    messianic: "Acts 2 Spirit outpouring and church birth; Jew and Gentile in one body.",
    personal: "Dependence on the Holy Spirit and Spirit-led life.",
    keyVerses: ["Acts 2:1-4", "Romans 8:2", "Galatians 5:16"],
    larkinNote: "Two leavened loaves typify Jew and Gentile united in the church.",
  },
  {
    id: 5,
    name: "Trumpets",
    hebrew: "Rosh Hashanah",
    date: "Tishri 1",
    scripture: "Leviticus 23:23-25",
    season: "autumn",
    status: "AWAITING FULFILLMENT",
    historical: "Trumpet blasts begin the Days of Awe.",
    messianic: "Points to resurrection/rapture trumpet and royal appearing of Christ.",
    personal: "Watchfulness, readiness, and spiritual alertness.",
    keyVerses: ["1 Thessalonians 4:16-17", "1 Corinthians 15:51-52", "Matthew 24:31"],
  },
  {
    id: 6,
    name: "Day of Atonement",
    hebrew: "Yom Kippur",
    date: "Tishri 10",
    scripture: "Leviticus 23:26-32; Leviticus 16",
    season: "autumn",
    status: "AWAITING FULFILLMENT",
    historical: "High Priest entered Holy of Holies with blood; two-goat ritual.",
    messianic: "Israel will look upon Him and mourn; national cleansing and atonement.",
    personal: "Repentance and full surrender before God.",
    keyVerses: ["Zechariah 12:10", "Zechariah 13:1", "Romans 11:26", "Leviticus 16:30"],
  },
  {
    id: 7,
    name: "Tabernacles",
    hebrew: "Succoth",
    date: "Tishri 15-22",
    scripture: "Leviticus 23:33-44",
    season: "autumn",
    status: "AWAITING FULFILLMENT",
    historical: "Israel dwelt in booths celebrating wilderness care and harvest joy.",
    messianic: "Millennial kingdom: Messiah dwelling among His people.",
    personal: "Rest and joy in God's presence.",
    keyVerses: ["Zechariah 14:16", "Hebrews 4:9-11", "Revelation 20:4-6", "John 1:14"],
  },
];

const offerings: Offering[] = [
  {
    id: 1,
    name: "Burnt Offering (Olah)",
    category: "Sweet Savor",
    scripture: "Leviticus 1:1-17",
    what: "Male without blemish from herd/flock/fowls.",
    offerer: "Laid hand, slew animal, identified with sacrifice.",
    priest: "Handled blood, arranged and burned sacrifice.",
    godPortion: "Entire offering consumed by fire.",
    priestPortion: "Skin only.",
    symbolism: "Total consecration and surrender.",
    christ: "Christ gave Himself wholly as a sweet-smelling offering.",
    personal: "Present your body as a living sacrifice.",
    keyVerse: "Ephesians 5:2",
    steps: [
      "Bring offering to north side of altar.",
      "Lay hand heavily on head (identification/confession).",
      "Offerer slays the animal.",
      "Priest sprinkles blood around altar.",
      "Body prepared and wholly consumed on altar.",
    ],
  },
  {
    id: 2,
    name: "Meal Offering (Minchah)",
    category: "Sweet Savor",
    scripture: "Leviticus 2:1-16",
    what: "Fine flour/oil/salt/frankincense; no leaven or honey.",
    offerer: "Brought fruit of labor to the Lord.",
    priest: "Burned memorial handful; ate remainder.",
    godPortion: "Memorial handful + frankincense.",
    priestPortion: "Remaining meal.",
    symbolism: "Consecrated labor and holy service.",
    christ: "Sinless Bread of Life, bruised yet pure.",
    personal: "Dedicate work, gifts, and daily labor to God.",
    keyVerse: "John 6:35",
    steps: [
      "Offerer brings prepared meal offering.",
      "Priest takes handful + frankincense.",
      "Memorial portion burned on altar.",
      "Remainder belongs to priests.",
      "Typically offered alongside burnt offering.",
    ],
  },
  {
    id: 3,
    name: "Peace Offering (Shelamim)",
    category: "Sweet Savor",
    scripture: "Leviticus 3:1-17; 7:11-21",
    what: "Bull/lamb/goat (male or female) without blemish.",
    offerer: "Laid hand, slew animal, shared covenant meal.",
    priest: "Applied blood; received wave breast and heave shoulder.",
    godPortion: "Fat portions burned to the Lord.",
    priestPortion: "Breast and shoulder.",
    symbolism: "Communion and fellowship with God.",
    christ: "He is our peace; we feast by faith on Him.",
    personal: "Live in reconciled fellowship and thankful worship.",
    keyVerse: "Ephesians 2:14",
    steps: [
      "Offerer lays hand and slays animal.",
      "Priest sprinkles blood on altar.",
      "Fat portions burned to God.",
      "Priest receives wave/heave portions.",
      "Remaining meat eaten in covenant fellowship.",
    ],
  },
  {
    id: 4,
    name: "Sin Offering (Chatat)",
    category: "Sin Offering",
    scripture: "Leviticus 4:1-35",
    what: "Animal varies by status (priest/congregation/ruler/common).",
    offerer: "Confession and required sacrifice for sin.",
    priest: "Applied blood (sometimes into Holy Place); supervised disposal.",
    godPortion: "Fat burned on altar.",
    priestPortion: "Body in certain cases; none for highest-level cases.",
    symbolism: "Expiation and covering of guilt before God.",
    christ: "Made sin for us; suffered outside the camp.",
    personal: "Identify with rejected Christ and pursue holiness.",
    keyVerse: "2 Corinthians 5:21",
    steps: [
      "Offerer presents animal for sin class.",
      "Blood applied per class rules (altar/holy place).",
      "Fat burned on altar to God.",
      "Body handled according to class (outside camp for some).",
      "Atonement declared for offender.",
    ],
  },
  {
    id: 5,
    name: "Trespass Offering (Asham)",
    category: "Sin Offering",
    scripture: "Leviticus 5:1-6:7",
    what: "Lamb/kid or birds/flour depending on means.",
    offerer: "Confession + restitution + 20% where required.",
    priest: "Officiated sacrifice and atonement.",
    godPortion: "Fat burned.",
    priestPortion: "Body portions as appointed.",
    symbolism: "Reparation and restoration for specific wrongs.",
    christ: "Canceled legal debt and bore our trespasses.",
    personal: "Repent with concrete restitution where possible.",
    keyVerse: "Colossians 2:13-14",
    steps: [
      "Trespass identified and confessed.",
      "Restitution made in full + one-fifth.",
      "Appropriate offering brought by ability.",
      "Priest offers sacrifice and declares atonement.",
      "Relationship restored with God/neighbor.",
    ],
  },
];

const babyFeastCards = [
  ["Passover", "Day 14 of cycle: egg appears."],
  ["Unleavened Bread", "Fertilization must occur quickly; seed falls and life begins."],
  ["Firstfruits", "2-6 days: implantation begins growth."],
  ["Pentecost", "Around day 50: recognizable human form emerges."],
  ["Trumpets", "7th month day 1: hearing develops."],
  ["Atonement", "7th month day 10: blood profile shifts to baby's own."],
  ["Tabernacles", "7th month day 15: lungs complete for breathing."],
] as const;

const feastNav = [
  ["overview", "Overview"],
  ["feasts", "The 7 Feasts"],
  ["offerings", "The 5 Offerings"],
  ["timeline", "Prophetic Timeline"],
  ["comparison", "Comparison Table"],
] as const;

function normalize(text: string) {
  return text.toLowerCase();
}

export function FeastsOfferingsStudyPage() {
  const [search, setSearch] = useState("");
  const [feastFilter, setFeastFilter] = useState<"all" | "spring" | "autumn">("all");
  const [offeringFilter, setOfferingFilter] = useState<"all" | "sweet" | "sin">("all");
  const [feastTab, setFeastTab] = useState<Record<number, "Historical" | "Messianic" | "Personal">>({});
  const [expandedOffering, setExpandedOffering] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const prevBody = document.body.style.backgroundColor;
    const prevRoot = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#0f0d08";
    document.body.style.backgroundColor = "#0f0d08";
    return () => {
      document.documentElement.style.backgroundColor = prevRoot;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-fade]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("seen");
      },
      { threshold: 0.12 },
    );
    nodes.forEach((n, idx) => {
      n.style.transitionDelay = `${idx * 40}ms`;
      io.observe(n);
    });
    return () => io.disconnect();
  }, []);

  const feastRows = useMemo(() => {
    const q = normalize(search.trim());
    return feasts.filter((f) => {
      if (feastFilter !== "all" && f.season !== feastFilter) return false;
      if (!q) return true;
      return normalize([f.name, f.hebrew, f.scripture, f.historical, f.messianic, f.personal, f.keyVerses.join(" ")].join(" ")).includes(q);
    });
  }, [search, feastFilter]);

  const offeringRows = useMemo(() => {
    const q = normalize(search.trim());
    return offerings.filter((o) => {
      if (offeringFilter === "sweet" && o.category !== "Sweet Savor") return false;
      if (offeringFilter === "sin" && o.category !== "Sin Offering") return false;
      if (!q) return true;
      return normalize([o.name, o.scripture, o.what, o.symbolism, o.keyVerse].join(" ")).includes(q);
    });
  }, [search, offeringFilter]);

  const feastStatusPill = (status: Feast["status"]) =>
    status === "FULFILLED" ? "bg-[#2e6b3e33] text-[#87d39e] border-[#2e6b3e88]" : "bg-[#7b4a0e33] text-[#f2c78f] border-[#7b4a0e88]";

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#0f0d08] text-[#f0e6c8]">
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=EB+Garamond:wght@400;500;700&display=swap');
      .fo-title{font-family:"Cinzel Decorative",serif}
      .fo-body{font-family:"EB Garamond",serif}
      .grain::before{content:"";position:fixed;inset:0;pointer-events:none;background-image:radial-gradient(circle at 1px 1px, rgba(240,230,200,.04) 1px, transparent 0);background-size:16px 16px;opacity:.35;z-index:0}
      .fo-card{background:#1a1510;border:1px solid rgba(201,162,39,.35);box-shadow:0 0 0 rgba(201,162,39,0);transition:all .25s ease}
      .fo-card:hover{box-shadow:0 0 18px rgba(201,162,39,.22)}
      .divider{height:1px;background:linear-gradient(90deg,transparent,#c9a227,transparent)}
      .fade{opacity:0;transform:translateY(12px);transition:all .45s ease}
      .fade.seen{opacity:1;transform:none}
      `}</style>

      <div className="grain fo-body relative z-10">
        <nav className="sticky top-0 z-30 border-b border-[#c9a22733] bg-[#0f0d08f2] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-3">
            {feastNav.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-full border border-[#c9a22755] px-3 py-1 text-xs hover:bg-[#c9a22722]">
                {label}
              </a>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <details className="group relative">
                <summary className="cursor-pointer rounded-full border border-[#c9a22755] px-3 py-1 text-xs">Spring/Autumn</summary>
                <div className="absolute right-0 mt-2 min-w-40 rounded-lg border border-[#c9a22755] bg-[#1a1510] p-2 text-xs">
                  <a href="#feasts" className="block rounded px-2 py-1 hover:bg-[#c9a22722]">Spring Feasts</a>
                  <a href="#feasts" className="block rounded px-2 py-1 hover:bg-[#c9a22722]">Autumn Feasts</a>
                </div>
              </details>
              <details className="group relative">
                <summary className="cursor-pointer rounded-full border border-[#c9a22755] px-3 py-1 text-xs">Sweet/Sin</summary>
                <div className="absolute right-0 mt-2 min-w-40 rounded-lg border border-[#c9a22755] bg-[#1a1510] p-2 text-xs">
                  <a href="#offerings" className="block rounded px-2 py-1 hover:bg-[#c9a22722]">Sweet Savor</a>
                  <a href="#offerings" className="block rounded px-2 py-1 hover:bg-[#c9a22722]">Sin Offerings</a>
                </div>
              </details>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search feasts, offerings, references..."
                className="rounded border border-[#c9a22766] bg-[#120f0b] px-2 py-1 text-xs text-[#f0e6c8] placeholder:text-[#c2b79e]"
              />
            </div>
          </div>
        </nav>

        <header className="mx-auto max-w-7xl px-4 py-10 text-center">
          <h1 className="fo-title text-4xl text-[#f0e6c8] sm:text-5xl">The Feasts & Offerings of the Lord</h1>
          <p className="mt-3 text-lg text-[#c9a227]">God&apos;s Calendar of Redemption — Hidden in Plain Sight</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="rounded-full border border-[#c9a22755] px-3 py-1">Leviticus 23 — The Feasts</span>
            <span className="rounded-full border border-[#c9a22755] px-3 py-1">Leviticus 1-7 — The Offerings</span>
          </div>
          <div className="mt-6 overflow-hidden rounded-full border border-[#c9a22755] text-xs font-medium">
            <div className="grid grid-cols-[1fr_auto_1fr]">
              <div className="bg-[#2e6b3e77] px-3 py-2">The Spring Feasts are FULFILLED</div>
              <div className="bg-[#0f0d08] px-3 py-2 text-[#c9a227]">✝</div>
              <div className="bg-[#7b4a0e77] px-3 py-2">The Autumn Feasts AWAIT fulfillment</div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-12 px-4 pb-16">
          <section id="overview" data-fade className="fade">
            <div className="divider mb-6" />
            <h2 className="fo-title text-3xl text-[#c9a227]">Overview: Why Study the Feasts & Offerings?</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <article className="fo-card rounded-xl p-5">
                <h3 className="fo-title text-xl">God&apos;s Prophetic Calendar</h3>
                <ul className="mt-3 space-y-1 text-sm">
                  <li>• Given by God to Israel (Leviticus 23)</li>
                  <li>• 7 feasts total, divided into 4 spring + 3 autumn</li>
                  <li>• The interval pictures the Church Age</li>
                  <li>• Spring feasts fulfilled at Christ&apos;s first coming</li>
                  <li>• Autumn feasts await second-coming fulfillment</li>
                  <li>• Hebrew mo&apos;ed = appointed times/rehearsals</li>
                  <li>• Shadow in Col 2:16-17, substance in Christ</li>
                </ul>
                <blockquote className="mt-4 rounded border-l-4 border-[#c9a227] bg-[#120f0b] p-3 text-sm">
                  <strong>Key Verse:</strong> Colossians 2:16-17
                </blockquote>
              </article>
              <article className="fo-card rounded-xl p-5">
                <h3 className="fo-title text-xl">The Way to God Through Sacrifice</h3>
                <ul className="mt-3 space-y-1 text-sm">
                  <li>• Given through Moses in Leviticus 1-7</li>
                  <li>• 5 offerings: Burnt, Meal, Peace, Sin, Trespass</li>
                  <li>• Sweet Savor (voluntary) + Sin (compulsory)</li>
                  <li>• Each offering reveals an aspect of Christ</li>
                  <li>• Without shedding of blood, no forgiveness (Heb 9:22)</li>
                  <li>• Christ fulfills all offerings</li>
                  <li>• Larkin: Leviticus is key to Christ&apos;s office and work</li>
                </ul>
                <blockquote className="mt-4 rounded border-l-4 border-[#c9a227] bg-[#120f0b] p-3 text-sm">
                  <strong>Key Verse:</strong> Hebrews 10:1
                </blockquote>
              </article>
            </div>
          </section>

          <section id="feasts" data-fade className="fade">
            <div className="divider mb-6" />
            <h2 className="fo-title text-3xl text-[#c9a227]">The Seven Feasts of the Lord</h2>
            <p className="mt-1 text-sm text-[#dbcfae]">Leviticus 23:1-44 — Seven divine appointments, rehearsals of redemption.</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <button onClick={() => setFeastFilter("all")} className={`rounded-full border px-3 py-1 ${feastFilter === "all" ? "bg-[#c9a227] text-[#0f0d08]" : "border-[#c9a22755]"}`}>Show All</button>
              <button onClick={() => setFeastFilter("spring")} className={`rounded-full border px-3 py-1 ${feastFilter === "spring" ? "bg-[#2e6b3e] text-[#f0e6c8]" : "border-[#2e6b3e99]"}`}>Spring Feasts</button>
              <button onClick={() => setFeastFilter("autumn")} className={`rounded-full border px-3 py-1 ${feastFilter === "autumn" ? "bg-[#7b4a0e] text-[#f0e6c8]" : "border-[#7b4a0e99]"}`}>Autumn Feasts</button>
            </div>

            <div className="fo-card mt-4 overflow-x-auto rounded-xl p-4 text-xs">
              <div className="min-w-[64rem]">
                <div className="relative h-1 rounded bg-[#c9a22766]" />
                <div className="mt-3 grid grid-cols-7 gap-2 text-center">
                  {feasts.map((f) => (
                    <div key={f.id}>
                      <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 ${f.season === "spring" ? "border-[#2e6b3e] bg-[#2e6b3e44]" : "border-[#7b4a0e] bg-[#7b4a0e44]"}`}>
                        {f.id}
                      </div>
                      <p className="mt-1 font-semibold">{f.name}</p>
                      <p className="text-[10px] text-[#d2c39f]">{f.date}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center text-[11px] text-[#c9a227]">THE CHURCH AGE / LONG INTERVAL</div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {feastRows.map((f) => {
                const tab = feastTab[f.id] ?? "Historical";
                const activeText = tab === "Historical" ? f.historical : tab === "Messianic" ? f.messianic : f.personal;
                return (
                  <article key={f.id} className="fo-card rounded-xl p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#c9a227] bg-[#8b1a1a55] text-sm font-bold">
                          {f.id}
                        </span>
                        <div>
                          <h3 className="fo-title text-2xl">{f.name}</h3>
                          <p className="text-sm text-[#d5c8a6]">
                            {f.hebrew} • {f.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full border border-[#c9a22755] px-2 py-1">{f.scripture}</span>
                        <span className={`rounded-full border px-2 py-1 ${feastStatusPill(f.status)}`}>{f.status}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {(["Historical", "Messianic", "Personal"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setFeastTab((prev) => ({ ...prev, [f.id]: t }))}
                          className={`rounded-full border px-3 py-1 ${tab === t ? "bg-[#c9a227] text-[#0f0d08]" : "border-[#c9a22766]"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">{activeText}</p>
                    {f.larkinNote ? (
                      <p className="mt-2 rounded border-l-2 border-[#c9a227] bg-[#120f0b] px-3 py-2 text-xs italic text-[#dccda8]">
                        Larkin note: {f.larkinNote}
                      </p>
                    ) : null}
                    <p className="mt-3 text-xs text-[#d8cba9]">Key verses: {f.keyVerses.join(" • ")}</p>
                  </article>
                );
              })}
            </div>

            <article className="mt-6 rounded-xl border border-[#7b4a0e99] bg-gradient-to-r from-[#3f2409] to-[#6a3d0b] p-5 text-sm">
              <h3 className="fo-title text-xl text-[#f0d6a5]">THE LONG INTERVAL — THE CHURCH AGE</h3>
              <p className="mt-2 leading-relaxed">
                Between Pentecost and Trumpets lies the prophetic gap often linked to the present Church Age, during which the Holy Spirit gathers the elect. When God resumes national dealings with Israel, autumn feast fulfillments begin.
              </p>
              <p className="mt-2 text-xs">Reference: Amos 9:14-15, Isaiah 11:11</p>
            </article>
          </section>

          <section id="offerings" data-fade className="fade">
            <div className="divider mb-6" />
            <h2 className="fo-title text-3xl text-[#c9a227]">The Five Offerings of Leviticus</h2>
            <p className="mt-1 text-sm">The way to God through sacrifice — Leviticus 1-7.</p>
            <p className="mt-1 text-xs italic text-[#d9c9a3]">
              Larkin: &quot;We cannot understand the Office and Work of Christ without studying the Book of Leviticus.&quot;
            </p>
            <div className="mt-3 rounded-lg border border-[#c9a22766] p-3 text-center text-xs">
              <span className="text-[#4a7a9b]">SWEET SAVOR OFFERINGS — Voluntary</span> ←→{" "}
              <span className="text-[#6b2020]">SIN OFFERINGS — Compulsory</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <button onClick={() => setOfferingFilter("all")} className={`rounded-full border px-3 py-1 ${offeringFilter === "all" ? "bg-[#c9a227] text-[#0f0d08]" : "border-[#c9a22755]"}`}>Show All</button>
              <button onClick={() => setOfferingFilter("sweet")} className={`rounded-full border px-3 py-1 ${offeringFilter === "sweet" ? "bg-[#4a7a9b] text-white" : "border-[#4a7a9b99]"}`}>Sweet Savor</button>
              <button onClick={() => setOfferingFilter("sin")} className={`rounded-full border px-3 py-1 ${offeringFilter === "sin" ? "bg-[#6b2020] text-white" : "border-[#6b202099]"}`}>Sin Offerings</button>
            </div>

            <div className="mt-5 space-y-4">
              {offeringRows.map((o) => (
                <article key={o.id} className={`fo-card rounded-xl p-5 ${o.category === "Sweet Savor" ? "border-l-4 border-l-[#4a7a9b]" : "border-l-4 border-l-[#6b2020]"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="fo-title text-2xl">{o.name}</h3>
                      <p className="text-xs">{o.scripture}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-xs ${o.category === "Sweet Savor" ? "border-[#4a7a9b99] text-[#8fb5d1]" : "border-[#6b202099] text-[#d08f8f]"}`}>
                      {o.category}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <p><strong>What:</strong> {o.what}</p>
                    <p><strong>Offerer:</strong> {o.offerer}</p>
                    <p><strong>Priest:</strong> {o.priest}</p>
                    <p><strong>God&apos;s Portion:</strong> {o.godPortion}</p>
                    <p><strong>Priest&apos;s Portion:</strong> {o.priestPortion}</p>
                    <p><strong>Symbolism:</strong> {o.symbolism}</p>
                  </div>
                  <p className="mt-2 text-sm"><strong>Christ as our...</strong> {o.christ}</p>
                  <p className="mt-1 text-sm"><strong>Personal application:</strong> {o.personal}</p>
                  <p className="mt-1 text-xs text-[#d8c9a4]">
                    <strong>Key NT verse:</strong> {o.keyVerse}
                  </p>
                  <button
                    onClick={() => setExpandedOffering((p) => ({ ...p, [o.id]: !p[o.id] }))}
                    className="mt-3 rounded border border-[#c9a22766] px-3 py-1 text-xs hover:bg-[#c9a22722]"
                  >
                    {expandedOffering[o.id] ? "Hide ritual steps" : "Show ritual steps"}
                  </button>
                  {expandedOffering[o.id] ? (
                    <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
                      {o.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section id="timeline" data-fade className="fade">
            <div className="divider mb-6" />
            <h2 className="fo-title text-3xl text-[#c9a227]">The Feasts as God&apos;s Prophetic Calendar</h2>
            <div className="fo-card mt-4 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#d8c79d]">Historical (months 1-7)</p>
              <div className="mt-2 grid gap-2 md:grid-cols-8">
                {["Passover", "Unleavened Bread", "Firstfruits", "Pentecost", "Trumpets", "Atonement", "Tabernacles", " "].map((x, i) => (
                  <div key={`${x}-${i}`} className="rounded border border-[#c9a22755] bg-[#120f0b] p-2 text-center text-xs">
                    {x || "—"}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs uppercase tracking-wider text-[#d8c79d]">Prophetic Fulfillment</p>
              <div className="mt-2 space-y-2 text-sm">
                <p>PASSOVER → CRUCIFIXION (30 AD)</p>
                <p>UNLEAVENED BREAD → BURIAL (30 AD)</p>
                <p>FIRSTFRUITS → RESURRECTION (30 AD)</p>
                <p>PENTECOST → HOLY SPIRIT / CHURCH BORN (30 AD)</p>
                <p className="rounded border border-dashed border-[#c9a22788] bg-[#1a1510] px-3 py-2 text-[#c9a227]">
                  [GAP — THE CHURCH AGE — 2000 years and counting] &nbsp; <strong>We Are Here →</strong>
                </p>
                <p>TRUMPETS → RAPTURE / RESURRECTION (future)</p>
                <p>ATONEMENT → SECOND COMING / ISRAEL&apos;S NATIONAL SALVATION (future)</p>
                <p>TABERNACLES → MILLENNIAL KINGDOM (future)</p>
              </div>
            </div>
          </section>

          <section id="comparison" data-fade className="fade">
            <div className="divider mb-6" />
            <h2 className="fo-title text-3xl text-[#c9a227]">Comparison Tables</h2>

            <h3 className="mt-5 text-xl">All 7 Feasts</h3>
            <div className="mt-3 overflow-auto">
              <table className="min-w-[70rem] w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#c9a22722] text-left">
                    <th className="p-2">Feast</th><th className="p-2">Date</th><th className="p-2">Hebrew</th><th className="p-2">Historical</th><th className="p-2">Messianic</th><th className="p-2">Personal</th><th className="p-2">Status</th><th className="p-2">Key Verses</th>
                  </tr>
                </thead>
                <tbody>
                  {feasts.map((f) => (
                    <tr key={f.id} className={f.season === "spring" ? "bg-[#2e6b3e22]" : "bg-[#7b4a0e22]"}>
                      <td className="p-2">{f.name}</td><td className="p-2">{f.date}</td><td className="p-2">{f.hebrew}</td><td className="p-2">{f.historical}</td><td className="p-2">{f.messianic}</td><td className="p-2">{f.personal}</td>
                      <td className="p-2">{f.status}</td><td className="p-2">{f.keyVerses.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-8 text-xl">All 5 Offerings</h3>
            <div className="mt-3 overflow-auto">
              <table className="min-w-[74rem] w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#c9a22722] text-left">
                    <th className="p-2">Offering</th><th className="p-2">Category</th><th className="p-2">What</th><th className="p-2">Offerer&apos;s Act</th><th className="p-2">Priest&apos;s Act</th><th className="p-2">God&apos;s Portion</th><th className="p-2">Priest&apos;s Portion</th><th className="p-2">Christ as Our...</th><th className="p-2">Key NT Verse</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.map((o) => (
                    <tr key={o.id} className={o.category === "Sweet Savor" ? "bg-[#4a7a9b22]" : "bg-[#6b202022]"}>
                      <td className="p-2">{o.name}</td><td className="p-2">{o.category}</td><td className="p-2">{o.what}</td><td className="p-2">{o.offerer}</td><td className="p-2">{o.priest}</td><td className="p-2">{o.godPortion}</td><td className="p-2">{o.priestPortion}</td><td className="p-2">{o.christ}</td><td className="p-2">{o.keyVerse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="baby-feasts" data-fade className="fade">
            <div className="divider mb-6" />
            <h2 className="fo-title text-3xl text-[#c9a227]">Bonus: The Baby and the Feasts</h2>
            <p className="mt-2 text-sm">
              Zola Levitt (1979) highlighted correlations between feast sequence and human gestation milestones, emphasizing divine design patterns.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {babyFeastCards.map(([name, desc], idx) => (
                <article key={name} className="fo-card rounded-xl p-4">
                  <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#c9a227] bg-[#8b1a1a55] text-xs font-bold">
                    {idx + 1}
                  </div>
                  <p className="fo-title text-lg">{name}</p>
                  <p className="mt-1 text-sm">{desc}</p>
                </article>
              ))}
            </div>
            <blockquote className="fo-card mt-5 rounded-xl border-l-4 border-[#c9a227] p-4 text-sm italic">
              "No human being could have understood the gestation period 3,500 years ago. Its correlation with the Jewish Holy Days points to Intelligent Design and a Creator who governs history." — J.R. Church
            </blockquote>
          </section>
        </main>
      </div>
    </div>
  );
}

