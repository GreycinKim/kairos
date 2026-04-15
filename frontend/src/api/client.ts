import axios from "axios";

import { readAuthSession } from "@/lib/authSession";

/**
 * API base path. Priority:
 * 1. `VITE_API_BASE_URL` (e.g. `https://api.example.com/api` or `http://127.0.0.1:8000/api`)
 * 2. When the UI is served from this machine (`localhost` / `127.0.0.1`), talk straight to FastAPI
 *    so chapter loads work even if the Vite proxy is bypassed (preview, IDE webview, odd ports).
 * 3. Same-origin `/api` (production behind nginx, or LAN IP with a working proxy).
 *
 * If `VITE_API_BASE_URL` is an absolute URL with only a root path (e.g. `https://…onrender.com`),
 * `/api` is appended — FastAPI mounts all routes under `/api`, and omitting it yields 404s like
 * `GET …/jbch-hub` instead of `GET …/api/jbch-hub`.
 */
function normalizeEnvApiBaseIfRootOnly(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\/$/, "") || "/";
    if (path === "/") {
      u.pathname = "/api";
      return u.href.replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  return trimmed;
}

function resolveApiBaseURL(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) return normalizeEnvApiBaseIfRootOnly(fromEnv);

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

/** Same browser login → same Postgres `workspace_client_state` row (cross-device). */
api.interceptors.request.use((config) => {
  const u = readAuthSession()?.username;
  if (typeof u === "string" && u.trim()) {
    const key = `u:${u.trim().slice(0, 160)}`;
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)["X-Kairos-Workspace-Key"] = key;
  }
  return config;
});
