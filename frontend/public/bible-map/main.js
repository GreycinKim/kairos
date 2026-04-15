/**
 * Kairos biblical geography map — Leaflet + static JSON (cities, regions, routes).
 */
import { eraIndexToId, setEraLabel, openPanelLocation, openPanelRoute, bindPanelClose } from "./js/ui.js";
import { createMarkerCluster } from "./js/markers.js";
import { createRegionsLayer } from "./js/regions.js";
import { createRoutesLayer } from "./js/routes.js";
import { setupSearch } from "./js/search.js";

const DATA = {
  locations: "./data/locations.json",
  events: "./data/events.json",
  regions: "./data/regions.geojson",
  routes: "./data/routes.json",
};

async function loadJson(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

function readInitialEraFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("era");
  if (raw === null || raw === "") return 8;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || n > 8) return 8;
  return n;
}

async function init() {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;

  const qs = new URLSearchParams(window.location.search);
  if (qs.get("embed") === "1") {
    document.getElementById("app")?.classList.add("app--embed");
  }

  let locations = [];
  let events = [];
  let regionsGeo = null;
  let routes = [];

  try {
    locations = await loadJson(DATA.locations);
    events = await loadJson(DATA.events);
    try {
      regionsGeo = await loadJson(DATA.regions);
    } catch {
      regionsGeo = null;
    }
    try {
      routes = await loadJson(DATA.routes);
    } catch {
      routes = [];
    }
  } catch (e) {
    console.error(e);
    mapDiv.innerHTML = `<div class="map-error" style="padding:2rem;font-family:system-ui;color:#5c5648">Could not load map data. Check the console.</div>`;
    return;
  }

  const map = L.map(mapDiv, {
    center: [31.5, 35.0],
    zoom: 6,
    minZoom: 4,
    maxZoom: 12,
    zoomControl: true,
    maxBounds: [
      [18, 8],
      [48, 68],
    ],
    maxBoundsViscosity: 0.85,
  });

  const awmc = L.tileLayer("https://a.tiles.mapbox.com/v3/isawnyu.map-knmctlkh/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://dare.ht.lu.se/">AWMC / ISAW</a> Mapbox tiles; biblical data is interpretive.',
    maxZoom: 12,
    maxNativeZoom: 12,
  });

  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  });

  let usedFallback = false;
  awmc.on("tileerror", () => {
    if (usedFallback) return;
    usedFallback = true;
    try {
      map.removeLayer(awmc);
    } catch {
      /* */
    }
    osm.addTo(map);
  });

  awmc.addTo(map);

  let testamentFilter = "all";

  const eraSlider = document.getElementById("era-slider");
  const initialEra = readInitialEraFromUrl();
  if (eraSlider) {
    eraSlider.value = String(initialEra);
  }
  let eraFilter = eraIndexToId(Number(eraSlider?.value ?? 8));

  const regionsApi = createRegionsLayer(map, regionsGeo, {
    getEraFilter: () => eraFilter,
  });

  function openLocation(loc) {
    openPanelLocation(loc);
  }

  const markersApi = createMarkerCluster(map, locations, {
    onMarkerClick: openLocation,
  });

  let routesApi = null;
  if (Array.isArray(routes) && routes.length) {
    routesApi = createRoutesLayer(map, routes, {
      getTestamentFilter: () => testamentFilter,
      getEraFilter: () => eraFilter,
      onRouteSelect: (route) => {
        openPanelRoute(route);
      },
    });
  }

  function applyFilters() {
    markersApi.applyFilter(testamentFilter, eraFilter);
    regionsApi.refresh();
    routesApi?.applyFilter();
  }

  applyFilters();

  document.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg-btn").forEach((b) => {
        b.classList.remove("seg-btn--active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("seg-btn--active");
      btn.setAttribute("aria-pressed", "true");
      testamentFilter = btn.getAttribute("data-testament") || "all";
      applyFilters();
    });
  });

  eraSlider?.addEventListener("input", () => {
    eraFilter = eraIndexToId(Number(eraSlider.value));
    setEraLabel();
    applyFilters();
  });
  setEraLabel();

  bindPanelClose();

  window.addEventListener("message", (e) => {
    if (e.origin !== window.location.origin) return;
    const d = e.data;
    if (!d || d.source !== "kairos-parent" || d.type !== "kairos-route" || !d.routeId || !routesApi) return;
    routesApi.selectRouteById(d.routeId, { fly: d.fly !== false, notify: false });
    const r = routesApi.getRoute(d.routeId);
    if (r) openPanelRoute(r);
  });

  setupSearch({
    input: document.getElementById("map-search"),
    resultsEl: document.getElementById("search-results"),
    locations,
    events,
    routes,
    onPickLocation: (id) => {
      markersApi.flyToLocationId(id);
    },
    onPickEvent: (eid) => {
      const ev = events.find((x) => x.id === eid);
      if (ev?.locationId) markersApi.flyToLocationId(ev.locationId);
    },
    onPickRoute: (rid) => {
      if (!routesApi) return;
      routesApi.selectRouteById(rid, { fly: true, notify: false });
      const r = routesApi.getRoute(rid);
      if (r) openPanelRoute(r);
    },
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init());
} else {
  void init();
}
