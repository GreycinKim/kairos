/**
 * Copy atlas images from your Desktop Maps folder (or KAIROS_MAPS_DIR / argv[2])
 * into public/bible-map/workspace-maps/ and write workspace-maps-catalog.json.
 *
 * Usage (from frontend/):
 *   npm run sync:workspace-maps
 *   npm run sync:workspace-maps -- "C:\\path\\to\\Maps"
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.join(__dirname, "..");
const REPO = path.join(FRONTEND, "..");

async function firstExistingDir(candidates) {
  for (const p of candidates) {
    if (!p || typeof p !== "string") continue;
    const resolved = path.resolve(p);
    try {
      const st = await fs.stat(resolved);
      if (st.isDirectory()) return resolved;
    } catch {
      /* */
    }
  }
  return null;
}

function slugId(file) {
  const base = file.replace(/\.[^.]+$/i, "");
  return (
    "ws-" +
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

/** Life-of-Jesus export plates: stable catalog ids for `mapForPassage` / reader (tier 7+8 share `_7` image). */
const LOJ_PLATE_PREFIX = "1776216610758-0209927a-e698-4e7d-91c8-f6f21b9e43b3";
const LOJ_ENTRIES_FOR_FILE = {
  [`${LOJ_PLATE_PREFIX}_1.jpg`]: [
    { id: "ws-loj-1-birth-to-adulthood", title: "LOJ-1 · Birth to adulthood (Life of Jesus)" },
  ],
  [`${LOJ_PLATE_PREFIX}_2.jpg`]: [{ id: "ws-loj-2-ministry-begins", title: "LOJ-2 · Ministry begins (Life of Jesus)" }],
  [`${LOJ_PLATE_PREFIX}_3.jpg`]: [{ id: "ws-loj-3-early-ministry", title: "LOJ-3 · Early ministry (Life of Jesus)" }],
  [`${LOJ_PLATE_PREFIX}_4.jpg`]: [{ id: "ws-loj-4-galilean-ministry", title: "LOJ-4 · Galilean ministry (Life of Jesus)" }],
  [`${LOJ_PLATE_PREFIX}_5.jpg`]: [{ id: "ws-loj-5-gentile-ministry", title: "LOJ-5 · Gentile ministry (Life of Jesus)" }],
  [`${LOJ_PLATE_PREFIX}_6.jpg`]: [{ id: "ws-loj-6-heading-south", title: "LOJ-6 · Heading south (Life of Jesus)" }],
  [`${LOJ_PLATE_PREFIX}_7.jpg`]: [
    { id: "ws-loj-7-final-week", title: "LOJ-7 · Final week (Life of Jesus)" },
    { id: "ws-loj-8-post-resurrection", title: "LOJ-8 · Post-resurrection (Life of Jesus)" },
  ],
};

function catalogRowsForFile(file) {
  const loj = LOJ_ENTRIES_FOR_FILE[file];
  if (!loj) return [{ id: slugId(file), file, title: file.replace(/\.[^.]+$/i, "") }];
  return loj.map((row) => ({ id: row.id, file, title: row.title }));
}

async function main() {
  const arg = process.argv[2];
  const src = await firstExistingDir([
    arg && !arg.startsWith("-") ? arg : null,
    process.env.KAIROS_MAPS_DIR,
    path.join(REPO, "..", "Desktop", "Maps"),
    path.join(REPO, "Maps"),
  ]);

  if (!src) {
    console.error(
      "No maps folder found. Set KAIROS_MAPS_DIR or pass a path, e.g.:\n  npm run sync:workspace-maps -- \"C:\\\\Users\\\\you\\\\Desktop\\\\Maps\"",
    );
    process.exit(1);
  }

  const destDir = path.join(FRONTEND, "public", "bible-map", "workspace-maps");
  const catalogPath = path.join(FRONTEND, "public", "bible-map", "data", "workspace-maps-catalog.json");

  await fs.mkdir(destDir, { recursive: true });
  const files = await fs.readdir(src);
  const images = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  images.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const entries = [];
  for (const file of images) {
    await fs.copyFile(path.join(src, file), path.join(destDir, file));
    entries.push(...catalogRowsForFile(file));
  }

  const catalog = {
    generated: new Date().toISOString(),
    source: src,
    entries,
  };
  await fs.mkdir(path.dirname(catalogPath), { recursive: true });
  await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(
    `Synced ${images.length} image(s) → ${entries.length} catalog entries from\n  ${src}\nto public/bible-map/workspace-maps/\nCatalog: public/bible-map/data/workspace-maps-catalog.json`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
