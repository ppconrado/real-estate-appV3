import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/shared/const";
import { sdk } from "@/server/auth/sdk";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const session = await sdk.verifySession(cookie);
  const dbUser = session?.openId
    ? await prisma.user.findUnique({ where: { openId: session.openId } })
    : null;
  return NextResponse.json({
    hasCookie: Boolean(cookie),
    cookieName: COOKIE_NAME,
    cookieValue: cookie ? `${cookie.substring(0, 20)}...` : null,
    session,
    dbUser: dbUser
      ? {
          id: dbUser.id,
          openId: dbUser.openId,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
        }
      : null,
  });
}
