import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth middleware placeholder for Supabase session refresh.
 * Demo mode skips auth gating so the app is usable without credentials.
 */
export async function middleware(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
