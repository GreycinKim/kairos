/**
 * Territorial GeoJSON layers — visibility driven by the same era ids as markers.
 * When era is "all" (slider 8), regions are hidden for a clean map.
 */

import { openPanelRegion } from "./ui.js";

function defaultStyle(visible, props) {
  return {
    color: props.stroke || "#1a2744",
    weight: visible ? 2 : 0,
    fillColor: props.fill || "#8b7355",
    fillOpacity: visible ? Number(props.fillOpacity ?? 0.24) : 0,
    interactive: visible,
    className: visible ? "bib-region bib-region--visible" : "bib-region bib-region--hidden",
  };
}

function isFeatureVisible(feature, eraId) {
  if (eraId == null) return false;
  const eras = feature.properties?.mapEras;
  if (!Array.isArray(eras) || !eras.length) return false;
  return eras.includes(eraId);
}

export function createRegionsLayer(map, geojson, { getEraFilter }) {
  if (!geojson || geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    return { refresh: () => {}, dispose: () => {} };
  }

  const paneName = "bibRegionPane";
  if (!map.getPane(paneName)) {
    const p = map.createPane(paneName);
    p.style.zIndex = "450";
  }

  const layer = L.geoJSON(geojson, {
    pane: paneName,
    style: (feature) => defaultStyle(isFeatureVisible(feature, getEraFilter()), feature.properties || {}),
    onEachFeature(feature, lyr) {
      lyr.on("click", () => {
        if (!isFeatureVisible(feature, getEraFilter())) return;
        openPanelRegion(feature);
      });
    },
  });

  layer.addTo(map);

  function refresh() {
    const eraId = getEraFilter();
    layer.eachLayer((lyr) => {
      const f = lyr.feature;
      const vis = isFeatureVisible(f, eraId);
      lyr.setStyle(defaultStyle(vis, f.properties || {}));
      const el = typeof lyr.getElement === "function" ? lyr.getElement() : lyr._path;
      if (el) el.style.pointerEvents = vis ? "auto" : "none";
    });
  }

  return {
    layer,
    refresh,
    dispose() {
      try {
        map.removeLayer(layer);
      } catch {
        /* */
      }
    },
  };
}
