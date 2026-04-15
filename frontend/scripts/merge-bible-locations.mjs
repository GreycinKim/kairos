/**
 * Merges public/bible-map/data/locations.json with scripts/locations-extra.mjs
 * (same `id` in extra overwrites). Run: node frontend/scripts/merge-bible-locations.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { extra } from "./locations-extra.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const basePath = path.join(__dirname, "../public/bible-map/data/locations.json");

const base = JSON.parse(fs.readFileSync(basePath, "utf8"));

const byId = new Map();
for (const x of base) byId.set(x.id, x);
for (const x of extra) byId.set(x.id, x);

const merged = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

fs.writeFileSync(basePath, JSON.stringify(merged, null, 2), "utf8");
console.log("locations.json:", merged.length, "places");
