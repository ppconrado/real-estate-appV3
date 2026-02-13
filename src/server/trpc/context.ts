import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { COOKIE_NAME } from "@/shared/const";
import { prisma } from "@/lib/prisma";
import { buildClearSessionCookieVariants } from "@/server/auth/cookies";
import { sdk } from "@/server/auth/sdk";

export type TrpcContext = {
  req: Request;
  user: User | null;
  setCookieHeaders: string[];
  clearSessionCookie: () => void;
};

async function getUserFromSession(sessionCookie: string) {
  const session = await sdk.verifySession(sessionCookie);
  if (!session) return null;

  const existing = await prisma.user.findUnique({
    where: { openId: session.openId },
  });

  if (existing) {
    const isOwner =
      process.env.OWNER_OPEN_ID && session.openId === process.env.OWNER_OPEN_ID;

    if (existing.name !== session.name || isOwner) {
      // Only update name, lastSignedIn, and role here. loginMethod cannot be updated from session.
      const updateData: Prisma.UserUpdateInput = {
        name: session.name || null,
        lastSignedIn: new Date(),
        role: isOwner ? "admin" : undefined,
      };
      return await prisma.user.update({
        where: { openId: session.openId },
        data: updateData,
      });
    }

    return existing;
  }

  try {
    const userInfo = await sdk.getUserInfoWithJwt(sessionCookie);
    const isOwner =
      process.env.OWNER_OPEN_ID &&
      userInfo.openId === process.env.OWNER_OPEN_ID;

    // Block user creation for Google OAuth logins (only allow if user already exists)
    if (
      (userInfo.loginMethod === "google" || userInfo.platform === "google") &&
      !isOwner
    ) {
      // Only return user if already exists
      const existingGoogleUser = await prisma.user.findUnique({
        where: { openId: userInfo.openId },
      });
      if (existingGoogleUser) {
        return existingGoogleUser;
      } else {
        console.warn("[Auth] Google OAuth attempted to create user, blocking.");
        return null;
      }
    }

    // For non-Google or OWNER, allow upsert
    return await prisma.user.upsert({
      where: { openId: userInfo.openId },
      update: {
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        // Only update loginMethod if not 'local'
        ...(userInfo.loginMethod !== "local"
          ? { loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null }
          : {}),
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
  } catch (error) {
    console.warn("[Auth] Failed to sync user:", error);
    return null;
  }
}

export async function createTrpcContext(req: Request): Promise<TrpcContext> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

  const setCookieHeaders: string[] = [];
  const clearSessionCookie = () => {
    buildClearSessionCookieVariants(req).forEach(value => {
      setCookieHeaders.push(value);
    });
  };

  let user: User | null = null;
  if (sessionCookie) {
    user = await getUserFromSession(sessionCookie);
    if (user) {
      console.log("[tRPC Context] User authenticated:", {
        openId: user.openId,
        name: user.name,
        email: user.email,
      });
    } else {
      console.warn("[tRPC Context] Session cookie present but user not found");
    }
  } else {
    console.log("[tRPC Context] No session cookie found");
  }

  return {
    req,
    user,
    setCookieHeaders,
    clearSessionCookie,
  };
}
