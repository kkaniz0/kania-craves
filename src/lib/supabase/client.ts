import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const forceDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  return !forceDemo && !!url && !!key && !url.includes("placeholder");
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Running in demo mode.");
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
