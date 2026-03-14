import { NextRequest, NextResponse } from "next/server";

const UNAUTHENTICATED_PAGES = ["/", "/refresh", "/search", "/leaderboard", "/article"];

function isPublicUserProfile(pathname: string): boolean {
  // Only match specific single-segment paths that look like usernames
  // Exclude known routes to prevent accidental exposure
  const usernamePattern = /^\/[a-zA-Z0-9_-]+$/;
  const reservedPaths = ["/admin", "/api", "/settings", "/dashboard", "/config"];
  return usernamePattern.test(pathname) && !reservedPaths.includes(pathname);
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)",
  ],
};

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const cookieAuthToken = req.cookies.get("privy-token");
  const cookieSession = req.cookies.get("privy-session");

  // Allow OAuth callback
  if (req.nextUrl.searchParams.get("privy_oauth_code")) {
    return NextResponse.next();
  }

  if (pathname === "/refresh") {
    return NextResponse.next();
  }

  if (
    UNAUTHENTICATED_PAGES.some(
      (page) => pathname === page || pathname.startsWith(`${page}/`)
    ) ||
    isPublicUserProfile(pathname)
  ) {
    return NextResponse.next();
  }

  const definitelyAuthenticated = Boolean(cookieAuthToken?.value && cookieAuthToken.value.length > 20);
  const maybeAuthenticated = Boolean(cookieSession?.value && cookieSession.value.length > 10);

  if (!definitelyAuthenticated && maybeAuthenticated) {
    const refreshUrl = new URL("/refresh", req.url);
    refreshUrl.searchParams.set(
      "redirect_uri",
      req.nextUrl.pathname + req.nextUrl.search
    );
    return NextResponse.redirect(refreshUrl);
  }

  if (!definitelyAuthenticated && !maybeAuthenticated) {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }

  // TODO: In production, verify the Privy JWT token signature here:
  // const isValid = await verifyPrivyToken(cookieAuthToken.value);
  // if (!isValid) { redirect to home }

  return NextResponse.next();
}
