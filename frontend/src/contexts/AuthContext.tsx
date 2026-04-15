import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  clearAuthSession,
  isAuthDisabled,
  readAuthSession,
  validateCredentialsForApp,
  writeAuthSession,
  type AuthSession,
} from "@/lib/authSession";

type AuthContextValue = {
  ready: boolean;
  authed: boolean;
  session: AuthSession | null;
  /** Returns false if username or password is wrong. */
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const disabled = isAuthDisabled();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    if (disabled) {
      setSession({ token: "dev", username: "dev", signedAt: Date.now() });
      setReady(true);
      return;
    }
    setSession(readAuthSession());
    setReady(true);
  }, [disabled]);

  const login = useCallback((username: string, password: string) => {
    if (disabled) return true;
    if (!validateCredentialsForApp(username, password)) return false;
    const next: AuthSession = {
      token: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `kairos-${Date.now()}`,
      username: username.trim() || null,
      signedAt: Date.now(),
    };
    writeAuthSession(next);
    setSession(next);
    return true;
  }, [disabled]);

  const logout = useCallback(() => {
    if (disabled) return;
    clearAuthSession();
    setSession(null);
  }, [disabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      authed: disabled || Boolean(session),
      session,
      login,
      logout,
    }),
    [ready, disabled, session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
