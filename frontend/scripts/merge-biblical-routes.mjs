/**
 * Merge clipboard-exported or hand-maintained route objects into public/bible-map/data/biblical-routes.json.
 * Usage (from repo root): node frontend/scripts/merge-biblical-routes.mjs [path/to/import.json]
 * Default import path: frontend/scripts/biblical-routes-import.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "public/bible-map/data/biblical-routes.json");
const defaultImport = path.join(__dirname, "biblical-routes-import.json");
const importPath = path.resolve(process.argv[2] ?? defaultImport);

const base = JSON.parse(fs.readFileSync(outPath, "utf8"));
const extra = JSON.parse(fs.readFileSync(importPath, "utf8"));
if (!Array.isArray(extra)) {
  console.error("Import file must be a JSON array of route objects.");
  process.exit(1);
}

const byId = new Map();
for (const r of base.routes ?? []) {
  if (r?.id) byId.set(r.id, r);
}
for (const r of extra) {
  if (!r?.id) continue;
  byId.set(r.id, r);
}

const merged = {
  dataNotes: Array.isArray(base.dataNotes) ? [...base.dataNotes] : [],
  routes: [...byId.values()],
};
merged.dataNotes.push(`Merged ${extra.length} routes from ${path.basename(importPath)} on ${new Date().toISOString().slice(0, 10)}.`);

fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf8");
console.log("Wrote", outPath, "routes:", merged.routes.length);
