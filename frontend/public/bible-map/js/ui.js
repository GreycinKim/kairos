/** Side panel, era display, testament UI helpers */

export const ERAS = [
  { id: "patriarchs", label: "Patriarchs", range: "c. 2000–1500 BC" },
  { id: "exodus-conquest", label: "Exodus & Conquest", range: "c. 1500–1050 BC" },
  { id: "united-kingdom", label: "United Kingdom", range: "c. 1050–930 BC" },
  { id: "divided-kingdom", label: "Divided Kingdom", range: "c. 930–586 BC" },
  { id: "exile-return", label: "Exile & Return", range: "c. 586–400 BC" },
  { id: "second-temple", label: "Second Temple", range: "c. 400 BC – AD 30" },
  { id: "jesus-ministry", label: "Jesus' Ministry", range: "c. AD 27–33" },
  { id: "early-church", label: "Early Church", range: "c. AD 33–100" },
];

export function eraIndexToId(sliderValue) {
  const v = Number(sliderValue);
  if (v >= 8 || v < 0) return null;
  return ERAS[v]?.id ?? null;
}

export function setEraLabel() {
  const labelEl = document.getElementById("era-label");
  const hintEl = document.getElementById("era-hint");
  const slider = document.getElementById("era-slider");
  if (!labelEl || !hintEl || !slider) return;

  const v = Number(slider.value);
  slider.setAttribute("aria-valuenow", String(v));

  if (v >= 8) {
    labelEl.textContent = "All eras";
    hintEl.textContent =
      "Showing all periods. Territorial overlays are hidden in “All”; pick an era to filter markers, journey lines, and regions.";
    return;
  }
  const e = ERAS[v];
  if (e) {
    labelEl.textContent = `${e.label} — ${e.range}`;
    hintEl.textContent = `Markers, dashed journey lines, and colored land regions (if any) match the ${e.label} period. Tap a line or region for notes.`;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPlaceType(t) {
  if (!t) return "Place";
  const s = String(t).replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function openPanelLocation(loc) {
  const panel = document.getElementById("side-panel");
  const body = document.getElementById("panel-body");
  const title = document.getElementById("panel-title");
  if (!panel || !body || !title) return;

  title.textContent = loc.name;
  const testamentBadges = (loc.testament || [])
    .map((x) => `<span class="panel-badge panel-badge--muted">${escapeHtml(x)}</span>`)
    .join("");

  const scriptureHtml = (loc.scripture || []).length
    ? (loc.scripture || [])
        .map(
          (s) =>
            `<blockquote class="scripture-card"><cite>${escapeHtml(s.ref)}</cite><p>${escapeHtml(s.text)}</p></blockquote>`,
        )
        .join("")
    : `<p class="panel-desc panel-desc--muted">No scripture block stored for this place yet.</p>`;

  const eventsHtml = (loc.events || []).length
    ? (loc.events || []).map((e) => `<li>${escapeHtml(e)}</li>`).join("")
    : `<li class="panel-events--empty">No key events listed yet.</li>`;

  const eraTags = (loc.era || [])
    .map((eid) => {
      const meta = ERAS.find((x) => x.id === eid);
      return `<span class="era-tag">${escapeHtml(meta ? meta.label : eid)}</span>`;
    })
    .join("");

  const nameMeaningBlock =
    loc.nameMeaning != null && String(loc.nameMeaning).trim()
      ? `<h3 class="panel-section-title">Name meaning</h3><p class="panel-desc panel-desc--muted">${escapeHtml(String(loc.nameMeaning).trim())}</p>`
      : `<h3 class="panel-section-title">Name meaning</h3><p class="panel-desc panel-desc--muted">No short etymology is stored for this name (many ancient names are uncertain).</p>`;

  body.innerHTML = `
    <p class="panel-modern panel-modern--accent">${escapeHtml(loc.modernName || "Modern location not set")}</p>
    <div class="panel-badges">
      <span class="panel-badge">${escapeHtml(formatPlaceType(loc.type))}</span>
      ${testamentBadges || `<span class="panel-badge panel-badge--muted">—</span>`}
    </div>
    <p class="panel-desc">${escapeHtml(loc.description || "")}</p>
    <h3 class="panel-section-title">Key events</h3>
    <ul class="panel-events">${eventsHtml}</ul>
    <h3 class="panel-section-title">Scripture</h3>
    ${scriptureHtml}
    <h3 class="panel-section-title">Appears in eras</h3>
    <div class="era-tags">${eraTags || '<span class="era-tag">—</span>'}</div>
    ${nameMeaningBlock}
  `;

  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
}

export function openPanelRoute(route) {
  const panel = document.getElementById("side-panel");
  const body = document.getElementById("panel-body");
  const title = document.getElementById("panel-title");
  if (!panel || !body || !title) return;

  title.textContent = route.name;
  const testamentBadges = (route.testament || [])
    .map((x) => `<span class="panel-badge panel-badge--muted">${escapeHtml(x)}</span>`)
    .join("");

  const books = (route.books || []).filter(Boolean).join(", ");
  const booksLine = books
    ? `<p class="panel-modern panel-modern--accent">${escapeHtml(books)}</p>`
    : `<p class="panel-modern">Biblical books not tagged for this path yet.</p>`;

  const labels = route.labels || [];
  const path = route.path || [];
  let waypointHtml = "";
  if (labels.length && path.length) {
    const n = Math.min(labels.length, path.length);
    const items = [];
    for (let i = 0; i < n; i++) {
      const lab = labels[i];
      if (!lab || lab === "—") continue;
      items.push(`<li><strong>${escapeHtml(lab)}</strong> · ${escapeHtml(String(path[i]?.[0] ?? ""))}, ${escapeHtml(String(path[i]?.[1] ?? ""))}</li>`);
    }
    waypointHtml =
      items.length > 0
        ? `<h3 class="panel-section-title">Waypoints (schematic)</h3><ul class="panel-events">${items.join("")}</ul>`
        : "";
  }

  const scriptureHtml = (route.scripture || []).length
    ? (route.scripture || [])
        .map(
          (s) =>
            `<blockquote class="scripture-card"><cite>${escapeHtml(s.ref)}</cite><p>${escapeHtml(s.text)}</p></blockquote>`,
        )
        .join("")
    : `<p class="panel-desc panel-desc--muted">Lines are interpretive reconstructions for study, not GPS tracks. Add <code>scripture</code> in <code>routes.json</code> to cite passages.</p>`;

  const eraTags = (route.eras || [])
    .map((eid) => {
      const meta = ERAS.find((x) => x.id === eid);
      return `<span class="era-tag">${escapeHtml(meta ? meta.label : eid)}</span>`;
    })
    .join("");

  body.innerHTML = `
    <p class="panel-badge">Journey / path</p>
    <div class="panel-badges">${testamentBadges || `<span class="panel-badge panel-badge--muted">—</span>`}</div>
    ${booksLine}
    <p class="panel-desc">${escapeHtml(route.summary || "")}</p>
    ${waypointHtml}
    <h3 class="panel-section-title">Scripture</h3>
    ${scriptureHtml}
    <h3 class="panel-section-title">Eras on map</h3>
    <div class="era-tags">${eraTags || '<span class="era-tag">—</span>'}</div>
    <p class="panel-desc panel-desc--muted" style="margin-top:1rem">Polylines connect approximate coordinates. Expand the dataset in <code>data/routes.json</code> (see <code>scripts/write-bible-routes.mjs</code>).</p>
  `;

  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
}

export function openPanelRegion(feature) {
  const panel = document.getElementById("side-panel");
  const body = document.getElementById("panel-body");
  const title = document.getElementById("panel-title");
  if (!panel || !body || !title) return;

  const p = feature.properties || {};
  title.textContent = p.name || "Region";

  const kind = p.kind || "region";
  let scriptureBlock = "";
  if (Array.isArray(p.scripture)) {
    scriptureBlock = p.scripture
      .map(
        (s) =>
          `<blockquote class="scripture-card"><cite>${escapeHtml(s.ref || "")}</cite><p>${escapeHtml(s.text || "")}</p></blockquote>`,
      )
      .join("");
  } else if (p.scripture && typeof p.scripture === "object") {
    const s = p.scripture;
    scriptureBlock = `<blockquote class="scripture-card"><cite>${escapeHtml(s.ref || "")}</cite><p>${escapeHtml(s.text || "")}</p></blockquote>`;
  } else if (typeof p.scripture === "string") {
    scriptureBlock = `<blockquote class="scripture-card"><p>${escapeHtml(p.scripture)}</p></blockquote>`;
  }

  const eraTags = (p.mapEras || [])
    .map((eid) => {
      const meta = ERAS.find((x) => x.id === eid);
      return `<span class="era-tag">${escapeHtml(meta ? meta.label : eid)}</span>`;
    })
    .join("");

  body.innerHTML = `
    <p class="panel-modern">Territorial layer · simplified for study (not survey-grade).</p>
    <span class="panel-badge">${escapeHtml(kind)}</span>
    <p class="panel-desc">${escapeHtml(p.description || "")}</p>
    ${p.notes ? `<p class="panel-desc panel-desc--muted">${escapeHtml(p.notes)}</p>` : ""}
    <h3 class="panel-section-title">Scripture</h3>
    ${scriptureBlock || "<p class=\"panel-desc\">Add a <code>scripture</code> string or array in GeoJSON properties to cite passages.</p>"}
    <h3 class="panel-section-title">Shown in eras</h3>
    <div class="era-tags">${eraTags || "<span class=\"era-tag\">—</span>"}</div>
  `;

  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
}

export function closePanel() {
  const panel = document.getElementById("side-panel");
  if (!panel) return;
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
}

export function bindPanelClose() {
  document.getElementById("panel-close")?.addEventListener("click", () => closePanel());
}
