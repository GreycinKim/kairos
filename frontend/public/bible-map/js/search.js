/** Search locations + events + routes */

export function setupSearch({ input, resultsEl, locations, events, routes = [], onPickLocation, onPickEvent, onPickRoute }) {
  const lower = (s) => String(s).toLowerCase();

  function score(text, q) {
    if (!q) return 0;
    const t = lower(text);
    const qq = lower(q);
    if (t === qq) return 100;
    if (t.startsWith(qq)) return 80;
    if (t.includes(qq)) return 50;
    return 0;
  }

  function run(query) {
    const q = query.trim();
    if (!q) {
      resultsEl.hidden = true;
      resultsEl.innerHTML = "";
      return;
    }

    const hits = [];

    for (const loc of locations) {
      let s = score(loc.name, q) * 2;
      s = Math.max(s, score(loc.modernName || "", q));
      s = Math.max(s, score(loc.description || "", q) * 0.9);
      s = Math.max(s, score(loc.nameMeaning || "", q) * 0.85);
      for (const ev of loc.events || []) {
        s = Math.max(s, score(ev, q) * 1.5);
      }
      for (const sc of loc.scripture || []) {
        s = Math.max(s, score(sc.ref || "", q) * 1.4);
        s = Math.max(s, score(sc.text || "", q) * 0.4);
      }
      if (s > 0) hits.push({ kind: "location", loc, s });
    }

    for (const ev of events) {
      const s = score(ev.name, q) * 1.6 + score(ev.description || "", q) * 0.5;
      if (s > 0) hits.push({ kind: "event", ev, s });
    }

    for (const route of routes) {
      let s = score(route.name, q) * 1.85;
      s = Math.max(s, score(route.summary || "", q) * 1.1);
      for (const b of route.books || []) {
        s = Math.max(s, score(b, q) * 1.3);
      }
      for (const lab of route.labels || []) {
        s = Math.max(s, score(lab, q) * 1.1);
      }
      if (s > 0) hits.push({ kind: "route", route, s });
    }

    hits.sort((a, b) => b.s - a.s);
    const top = hits.slice(0, 12);

    if (!top.length) {
      resultsEl.innerHTML = `<li class="search-empty"><button type="button" disabled>No matches</button></li>`;
      resultsEl.hidden = false;
      return;
    }

    resultsEl.innerHTML = top
      .map((h, i) => {
        if (h.kind === "location") {
          return `<li role="option" id="sr-${i}"><button type="button" data-kind="location" data-id="${htmlEscape(h.loc.id)}">
            <span>${htmlEscape(h.loc.name)}</span>
            <span class="search-meta">Place · ${htmlEscape(h.loc.type || "")}</span>
          </button></li>`;
        }
        if (h.kind === "route") {
          return `<li role="option" id="sr-${i}"><button type="button" data-kind="route" data-id="${htmlEscape(h.route.id)}">
            <span>${htmlEscape(h.route.name)}</span>
            <span class="search-meta">Journey</span>
          </button></li>`;
        }
        return `<li role="option" id="sr-${i}"><button type="button" data-kind="event" data-id="${htmlEscape(h.ev.id)}">
            <span>${htmlEscape(h.ev.name)}</span>
            <span class="search-meta">Event</span>
          </button></li>`;
      })
      .join("");

    resultsEl.hidden = false;

    resultsEl.querySelectorAll("button[data-kind]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kind = btn.getAttribute("data-kind");
        const id = btn.getAttribute("data-id");
        resultsEl.hidden = true;
        input.value = "";
        if (kind === "location" && id) onPickLocation(id);
        if (kind === "event" && id) onPickEvent(id);
        if (kind === "route" && id && onPickRoute) onPickRoute(id);
      });
    });
  }

  let t = null;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => run(input.value), 120);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim()) run(input.value);
  });

  document.addEventListener("click", (e) => {
    if (!resultsEl.contains(e.target) && e.target !== input) {
      resultsEl.hidden = true;
    }
  });
}

function htmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
