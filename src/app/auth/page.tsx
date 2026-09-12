"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthPage() {
  const configured = isSupabaseConfigured();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!configured) {
      setMessage(
        "Demo mode is active. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable real auth. Your local wishlist already works without signing in.",
      );
      return;
    }
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Signed in.");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm signup.");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    if (!configured) {
      setMessage("Connect Supabase to enable Google login.");
      return;
    }
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Each account has isolated wishlist, visits, and journal (RLS).
        </p>
      </div>

      {!configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Running in <strong>demo mode</strong> with local Jakarta seed data.
          Auth UI is ready — wire Supabase when you want multi-device sync.
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {message && (
          <p className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm">
            {message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {mode === "signin" ? "Sign in" : "Sign up"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={google}
        >
          Continue with Google
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--muted)]">
        {mode === "signin" ? "No account?" : "Have an account?"}{" "}
        <button
          type="button"
          className="font-medium text-[var(--accent)]"
          onClick={() =>
            setMode((m) => (m === "signin" ? "signup" : "signin"))
          }
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>

      <p className="text-center text-sm">
        <Link href="/" className="text-[var(--accent)]">
          Continue in demo mode →
        </Link>
      </p>
    </div>
  );
}
