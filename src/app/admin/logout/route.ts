import { NextResponse } from "next/server";

type RouteContext = {
  request: Request;
};

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set("admin_token", "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}
