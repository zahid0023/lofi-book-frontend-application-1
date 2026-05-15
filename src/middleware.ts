import { NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const PUBLIC_PREFIXES = ["/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!token && !isAuthRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthRoute) {
    const shopsUrl = request.nextUrl.clone();
    shopsUrl.pathname = "/shops";
    return NextResponse.redirect(shopsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
