import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSessionCookie } from "@/server/auth/cookies";
import { sdk } from "@/server/auth/sdk";
import { ONE_YEAR_MS } from "@/shared/const";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const devUser = await prisma.user.upsert({
    where: { openId: "dev-local-user" },
    update: {
      name: "Dev User",
      email: "dev@local",
      loginMethod: "dev",
      lastSignedIn: new Date(),
    },
    create: {
      openId: "dev-local-user",
      name: "Dev User",
      email: "dev@local",
      loginMethod: "dev",
      lastSignedIn: new Date(),
      role: "admin",
    },
  });

  const sessionToken = await sdk.createSessionToken(devUser.openId, {
    name: devUser.name || devUser.email || "Dev User",
    expiresInMs: ONE_YEAR_MS,
  });

  const response = NextResponse.redirect(new URL("/", req.url));
  response.headers.append("Set-Cookie", buildSessionCookie(sessionToken, req));
  return response;
}
