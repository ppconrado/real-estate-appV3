import { NextRequest, NextResponse } from "next/server";
import {
  buildClearCookieVariants,
  buildClearSessionCookieVariants,
} from "@/server/auth/cookies";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  const cookieNames = [
    "app_session_id",
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "__Host-authjs.session-token",
  ];
  cookieNames.forEach(name => {
    buildClearCookieVariants(name, req).forEach(value => {
      response.headers.append("Set-Cookie", value);
    });
  });
  buildClearSessionCookieVariants(req).forEach(value => {
    response.headers.append("Set-Cookie", value);
  });
  return response;
}
