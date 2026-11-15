import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

// Routes accessibles sans session.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectTo(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  search = "",
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;

  const redirect = NextResponse.redirect(url);
  // Conserve les cookies de session éventuellement rafraîchis par getUser().
  response.cookies.getAll().forEach(({ name, value, ...options }) => {
    redirect.cookies.set(name, value, options);
  });
  return redirect;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!data.user) {
    if (isPublicPath(pathname)) {
      return supabaseResponse;
    }
    return redirectTo(
      request,
      supabaseResponse,
      "/login",
      `?redirectTo=${encodeURIComponent(pathname)}`,
    );
  }

  // Un utilisateur connecté n'a rien à faire sur les pages de connexion/inscription.
  if (pathname === "/login" || pathname === "/signup") {
    return redirectTo(request, supabaseResponse, "/");
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
