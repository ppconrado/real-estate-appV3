import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@/shared/const";
import { prisma } from "@/lib/prisma";
import { getSessionCookieOptions } from "@/server/auth/cookies";
import { sdk } from "@/server/auth/sdk";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "code and state are required" },
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

    const isOwner =
      process.env.OWNER_OPEN_ID &&
      userInfo.openId === process.env.OWNER_OPEN_ID;

    await prisma.user.upsert({
      where: { openId: userInfo.openId },
      update: {
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
        role: isOwner ? "admin" : undefined,
      },
      create: {
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
        role: isOwner ? "admin" : "user",
      },
    });

    const displayName = userInfo.name || userInfo.email || "User";
    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: displayName,
      expiresInMs: ONE_YEAR_MS,
    });

    const response = NextResponse.redirect(new URL("/", req.url));
    const cookieOptions = getSessionCookieOptions(req);
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: Math.floor(ONE_YEAR_MS / 1000),
      expires: new Date(Date.now() + ONE_YEAR_MS),
    });
    console.log("[OAuth] Cookie set:", {
      name: COOKIE_NAME,
      options: cookieOptions,
      userOpenId: userInfo.openId,
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
