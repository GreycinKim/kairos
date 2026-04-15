const STORAGE_KEY = "kairos-auth-session-v1";

export type AuthSession = {
  token: string;
  username: string | null;
  signedAt: number;
};

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<AuthSession> & { email?: string };
    if (!o || typeof o.token !== "string" || !o.token) return null;
    const username =
      typeof o.username === "string"
        ? o.username
        : typeof o.email === "string"
          ? o.email
          : null;
    return {
      token: o.token,
      username,
      signedAt: typeof o.signedAt === "number" ? o.signedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    return parseSession(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* quota */
  }
}

export function clearAuthSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* */
  }
}

/** Default deploy gate; override with `VITE_LOGIN_USERNAME` / `VITE_LOGIN_PASSWORD` at build time. */
const DEFAULT_LOGIN_USERNAME = "admin";
const DEFAULT_LOGIN_PASSWORD = "lifeisintheblood";

/**
 * Username + password must match build-time env or the defaults above.
 * Note: credentials in the client bundle are not secret from determined users — use API auth for sensitive data.
 */
export function validateCredentialsForApp(username: string, password: string): boolean {
  const expectedUser = (import.meta.env.VITE_LOGIN_USERNAME?.trim() || DEFAULT_LOGIN_USERNAME).trim();
  const expectedPass = import.meta.env.VITE_LOGIN_PASSWORD ?? DEFAULT_LOGIN_PASSWORD;
  return username.trim() === expectedUser && password === expectedPass;
}

export function isAuthDisabled(): boolean {
  const v = import.meta.env.VITE_AUTH_DISABLED;
  return v === "true" || v === "1";
}
