/** Marker cluster, filters, custom icons */

const BASE = new URL("..", import.meta.url);

function iconForLocation(loc) {
  const t = loc.testament || [];
  let name = "pin-both.svg";
  if (t.includes("OT") && !t.includes("NT")) name = "pin-ot.svg";
  else if (t.includes("NT") && !t.includes("OT")) name = "pin-nt.svg";
  return L.icon({
    iconUrl: new URL(`icons/${name}`, BASE).href,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
    className: "biblical-marker-icon",
  });
}

function markerEl(m) {
  return m._icon || null;
}

export function createMarkerCluster(map, locations, { onMarkerClick }) {
  const group = L.markerClusterGroup({
    maxClusterRadius: 56,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    chunkedLoading: true,
  });

  const idToMarker = new Map();
  const idToLoc = new Map();

  for (const loc of locations) {
    const m = L.marker([loc.lat, loc.lng], {
      icon: iconForLocation(loc),
      title: loc.name,
      riseOnHover: true,
    });
    m._bibLocationId = loc.id;
    m.on("click", () => onMarkerClick(loc));
    m.on("add", () => {
      const el = markerEl(m);
      if (el) {
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", `${loc.name}. ${loc.type || "place"}. Open details.`);
      }
    });
    idToMarker.set(loc.id, m);
    idToLoc.set(loc.id, loc);
  }

  map.addLayer(group);

  function visibleFor(loc, testamentFilter, eraIdOrAll) {
    const t = loc.testament || [];
    let okT = testamentFilter === "all";
    if (testamentFilter === "OT") okT = t.includes("OT");
    if (testamentFilter === "NT") okT = t.includes("NT");

    let okE = true;
    if (eraIdOrAll) {
      okE = (loc.era || []).includes(eraIdOrAll);
    }
    return okT && okE;
  }

  return {
    group,
    idToMarker,
    idToLoc,
    locations,
    applyFilter(testamentFilter, eraIdOrAll) {
      group.clearLayers();
      for (const loc of locations) {
        if (!visibleFor(loc, testamentFilter, eraIdOrAll)) continue;
        const m = idToMarker.get(loc.id);
        if (m) group.addLayer(m);
      }
    },
    flyToLocationId(id) {
      const loc = idToLoc.get(id);
      if (!loc) return;
      map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 9), { duration: 1.1 });
      setTimeout(() => onMarkerClick(loc), 450);
    },
  };
}
