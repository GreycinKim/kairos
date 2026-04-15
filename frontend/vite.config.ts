import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react";
import type { Connect } from "vite";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Vite's html fallback only runs when Accept includes text/html or a star-slash-star wildcard. Narrow Accept headers skip the SPA shell and get a real 404. */
function spaAcceptCompatMiddleware(): Connect.NextHandleFunction {
  return (req, _res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const raw = req.url?.split("?")[0] ?? "";
    const pathname = decodeURIComponent(raw);
    if (!pathname || pathname === "/") return next();
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/@") ||
      pathname.startsWith("/__") ||
      pathname.startsWith("/src") ||
      pathname.startsWith("/node_modules") ||
      pathname.startsWith("/.vite")
    ) {
      return next();
    }
    if (/\.[a-zA-Z0-9]{1,12}$/.test(pathname)) return next();
    const acc = req.headers.accept;
    if (typeof acc === "string" && acc.length > 0 && !acc.includes("text/html") && !acc.includes("*/*")) {
      req.headers.accept = `${acc},text/html;q=0.9`;
    }
    next();
  };
}

const spaAcceptCompatPlugin = {
  name: "kairos-spa-accept-compat",
  configureServer(server: { middlewares: Connect.Server }) {
    server.middlewares.use(spaAcceptCompatMiddleware());
  },
  configurePreviewServer(server: { middlewares: Connect.Server }) {
    server.middlewares.use(spaAcceptCompatMiddleware());
  },
};

/** Dev + preview: forward `/api` to FastAPI (preview does not inherit `server` options). */
const apiProxy = {
  "/api": {
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
  },
} as const;

export default defineConfig({
  appType: "spa",
  plugins: [react(), spaAcceptCompatPlugin],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    // Do not pass `--host` via `npm run dev -- --host ...` on Windows; npm can drop the flag
    // and Vite will treat the IP as the project `root`, which breaks the app (ERR_INVALID_HTTP_RESPONSE).
    host: true,
    strictPort: true,
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
});
