import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/logout")) {
    return NextResponse.next();
  }

  const expectedToken = process.env.ADMIN_ACCESS_TOKEN;
  const providedToken = request.cookies.get("admin_token")?.value;

  if (expectedToken && providedToken === expectedToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
