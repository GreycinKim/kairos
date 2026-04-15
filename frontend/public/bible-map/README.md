# Kairos — Biblical geography (static)

Self-contained Leaflet map served from `public/bible-map/` (no bundler). Used inside Kairos at **`/scripture/maps`** via iframe.

## Run locally

From the Kairos repo, start the Vite dev server (`npm run dev` in `frontend/`), then open:

`http://localhost:5173/bible-map/index.html`

Or use the in-app **Scripture → Maps** entry.

## Data

Edit JSON under `data/`:

- `locations.json` — city/place markers, eras, testament tags, scripture quotes  
- `routes.json` — **journey polylines**: `{ id, name, summary, testament[], eras[], books[], path:[[lat,lng],...], labels?[], scripture?[] }`. Lines are schematic, not GPS tracks. Parent page can focus a route via `postMessage({ type:'kairos-route', routeId, source:'kairos-parent', fly:true }, origin)`.  
- `events.json` — searchable events (optional `locationId`)  
- `regions.geojson` — **territorial polygons** (GeoJSON `FeatureCollection`). Each feature’s `properties.mapEras` is an array of the same era **ids** as the era slider (`patriarchs`, `exodus-conquest`, `united-kingdom`, `divided-kingdom`, `exile-return`, `second-temple`, `jesus-ministry`, `early-church`). When the slider is on **All eras**, regions are hidden. Optional props: `fill`, `stroke`, `fillOpacity`, `kind`, `description`, `notes`, `scripture` (string, object, or array of `{ref,text}`).

Seed regions include: broad promised-land outline (Patriarchs / Exodus), **Joshua-style tribal blocks** (United Kingdom era), **Israel vs Judah** (Divided Kingdom), Persian **Yehud**, and **Roman Galilee / Samaria / Judea**. Shapes are **schematic**—replace with your own GeoJSON from atlases or GIS.

## Tiles

Primary layer: AWMC / ISAW Mapbox tiles. On tile load failure the app switches once to OpenStreetMap.

## Modules

- `main.js` — bootstrap  
- `js/ui.js` — side panel + era labels  
- `js/markers.js` — clustering + filters  
- `js/regions.js` — territorial GeoJSON layers  
- `js/routes.js` — dashed polylines + testament/era filter  
- `js/search.js` — typeahead (places, events, routes)  
