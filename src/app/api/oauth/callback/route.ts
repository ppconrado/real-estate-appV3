import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@/shared/const";
import { prisma } from "@/lib/prisma";
import { buildSessionCookie } from "@/server/auth/cookies";
import { sdk } from "@/server/auth/sdk";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "codigo ou estado ausente" },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return NextResponse.json(
        { error: "openId missing from user info" },
        { status: 400 }
      );
    }

    // Normalize and log Google email
    let googleEmail = userInfo.email;
    if (typeof googleEmail === "string") {
      googleEmail = googleEmail.trim().toLowerCase();
    } else {
      googleEmail = null;
    }
    console.log("[OAuth] Google userInfo:", userInfo);
    console.log("[OAuth] Normalized Google email:", googleEmail);

    if (!googleEmail) {
      console.error("[OAuth] No email from Google. Blocking login.");
      return NextResponse.json(
        { error: "No email from Google account." },
        { status: 400 }
      );
    }

    // Look up user by normalized email
    let user = await prisma.user.findFirst({
      where: { email: googleEmail },
    });
    console.log(
      "[OAuth] Prisma user lookup by email:",
      googleEmail,
      "Result:",
      user
    );

    if (!user) {
      console.error("[OAuth] No user found for email. Blocking login.");
      // Redirect to home page with error param for frontend toast/alert
      const homeUrl = new URL("/", req.nextUrl.origin);
      homeUrl.searchParams.set("error", "notfound");
      return NextResponse.redirect(homeUrl, 307);
    }

    // If user exists but openId is not set, update it to link Google account
    if (!user.openId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { openId: userInfo.openId },
      });
      console.log(
        "[OAuth] Linked Google openId to existing user:",
        user.id,
        userInfo.openId
      );
    }

    // Use the same session/cookie logic as normal login
    const displayName = userInfo.name || googleEmail || "User";
    const sessionToken = await sdk.signSession(
      {
        openId: user.openId,
        appId: "google",
        name: displayName,
      },
      { expiresInMs: ONE_YEAR_MS }
    );

    const response = NextResponse.redirect(new URL("/", req.url));
    response.headers.append(
      "Set-Cookie",
      buildSessionCookie(sessionToken, req)
    );
    console.log("[OAuth] Cookie set (unified logic):", {
      name: COOKIE_NAME,
      userOpenId: user.openId,
    });
    return response;
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return NextResponse.json(
      { error: "OAuth callback failed" },
      { status: 500 }
    );
  }
}
