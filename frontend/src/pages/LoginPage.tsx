import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const JBCH_ORANGE = "#ff8c00";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const ok = login(username, password);
      if (!ok) {
        setError("Invalid username or password.");
        return;
      }
      navigate(from.startsWith("/login") ? "/" : from, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, ${JBCH_ORANGE}, transparent 45%), radial-gradient(circle at 80% 60%, #3b2a6b, transparent 40%)`,
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg ring-1 ring-white/10"
            style={{ backgroundColor: JBCH_ORANGE }}
            aria-hidden
          >
            K
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Kairos</h1>
            <p className="mt-1 text-sm text-zinc-400">Sign in to continue</p>
          </div>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-white">Welcome back</CardTitle>
            <CardDescription className="text-zinc-400">Enter your username and password for this deployment.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="kairos-login-username" className="text-sm font-medium text-zinc-300">
                  Username
                </label>
                <Input
                  id="kairos-login-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="border-zinc-700 bg-zinc-950/80 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="kairos-login-password" className="text-sm font-medium text-zinc-300">
                  Password
                </label>
                <Input
                  id="kairos-login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-zinc-700 bg-zinc-950/80 text-white placeholder:text-zinc-600"
                />
              </div>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full font-medium"
                style={{ backgroundColor: JBCH_ORANGE }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-zinc-600">
          <BookOpen className="mb-1 inline-block h-3.5 w-3.5 align-middle opacity-70" aria-hidden />
          <span className="ml-1">Reader, timeline, maps, and notes after sign-in.</span>
        </p>
        <p className="mt-3 text-center text-[11px] text-zinc-600">
          Local dev: set{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-zinc-400">VITE_AUTH_DISABLED=true</code> to skip this
          screen.
        </p>
      </div>
    </div>
  );
}
