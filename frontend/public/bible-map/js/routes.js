/** Biblical journey polylines — filter by testament + era with markers */

const OT_COLOR = "#7c5a1c";
const NT_COLOR = "#2c5282";
const DIM_OPACITY = 0.22;
const LINE_WEIGHT = 3;

function routeColor(route) {
  const t = route.testament || [];
  if (t.includes("OT") && t.includes("NT")) return "#5b4b8a";
  if (t.includes("NT")) return NT_COLOR;
  return OT_COLOR;
}

function visibleForRoute(route, testamentFilter, eraIdOrAll) {
  const t = route.testament || [];
  let okT = testamentFilter === "all";
  if (testamentFilter === "OT") okT = t.includes("OT");
  if (testamentFilter === "NT") okT = t.includes("NT");

  let okE = true;
  if (eraIdOrAll) {
    const eras = route.eras || [];
    okE = eras.length === 0 || eras.includes(eraIdOrAll);
  }
  return okT && okE;
}

export function createRoutesLayer(map, routes, { getTestamentFilter, getEraFilter, onRouteSelect }) {
  const group = L.layerGroup().addTo(map);
  const idToLayer = new Map();
  const idToRoute = new Map();
  let selectedId = null;

  function styleAll(sel) {
    for (const [id, layer] of idToLayer) {
      const route = idToRoute.get(id);
      if (!route) continue;
      const isSel = id === sel;
      layer.setStyle({
        color: routeColor(route),
        weight: isSel ? LINE_WEIGHT + 3 : LINE_WEIGHT,
        opacity: sel && !isSel ? DIM_OPACITY : 0.9,
        dashArray: isSel ? null : "10 6",
      });
      if (isSel) layer.bringToFront();
    }
  }

  function selectRouteById(id, { fly = true, notify = true } = {}) {
    const route = idToRoute.get(id);
    const layer = idToLayer.get(id);
    if (!route || !layer) return;
    selectedId = id;
    styleAll(selectedId);
    if (fly) {
      const b = layer.getBounds();
      if (b.isValid()) map.fitBounds(b.pad(0.12), { maxZoom: 9, animate: true, duration: 0.9 });
    }
    if (notify && onRouteSelect) onRouteSelect(route);
  }

  for (const route of routes) {
    const latlngs = (route.path || []).map(([la, ln]) => L.latLng(la, ln));
    if (latlngs.length < 2) continue;

    const poly = L.polyline(latlngs, {
      color: routeColor(route),
      weight: LINE_WEIGHT,
      opacity: 0.88,
      dashArray: "10 6",
      lineCap: "round",
      lineJoin: "round",
    });
    poly._bibRouteId = route.id;
    poly.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      selectRouteById(route.id, { fly: false, notify: false });
      if (onRouteSelect) onRouteSelect(route);
    });
    idToLayer.set(route.id, poly);
    idToRoute.set(route.id, route);
  }

  function applyFilter() {
    const testament = getTestamentFilter();
    const era = getEraFilter();
    group.clearLayers();
    for (const route of routes) {
      if (!visibleForRoute(route, testament, era)) continue;
      const layer = idToLayer.get(route.id);
      if (layer) group.addLayer(layer);
    }
    const selRoute = selectedId ? idToRoute.get(selectedId) : null;
    if (selRoute && !visibleForRoute(selRoute, testament, era)) {
      selectedId = null;
    }
    styleAll(selectedId);
  }

  function getRoute(id) {
    return idToRoute.get(id) ?? null;
  }

  return {
    group,
    idToRoute,
    getRoute,
    applyFilter,
    selectRouteById,
    clearSelection() {
      selectedId = null;
      styleAll(null);
    },
    getSelectedId: () => selectedId,
  };
}
