import axios from "axios";

/**
 * API base path. Priority:
 * 1. `VITE_API_BASE_URL` (e.g. `https://api.example.com/api` or `http://127.0.0.1:8000/api`)
 * 2. When the UI is served from this machine (`localhost` / `127.0.0.1`), talk straight to FastAPI
 *    so chapter loads work even if the Vite proxy is bypassed (preview, IDE webview, odd ports).
 * 3. Same-origin `/api` (production behind nginx, or LAN IP with a working proxy).
 */
function resolveApiBaseURL(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return "http://127.0.0.1:8000/api";
    }
  }

  return "/api";
}

export const api = axios.create({
  baseURL: resolveApiBaseURL(),
  headers: { "Content-Type": "application/json" },
});
