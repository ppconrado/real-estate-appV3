import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildSessionCookie } from "@/server/auth/cookies";
import { sdk } from "@/server/auth/sdk";
import { ONE_YEAR_MS } from "@/shared/const";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().min(6),
  password: z.string().min(6),
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function POST(req: NextRequest) {
  let input: z.infer<typeof registerSchema>;
  try {
    input = registerSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Dados invalidos. Verifique o formulario." },
      { status: 400 }
    );
  }

  const email = normalizeEmail(input.email);
  const openId = `local:${nanoid(16)}`;

  const existing = await prisma.user.findFirst({
    where: { email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ja existe uma conta com este email." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      openId,
      name: input.name.trim(),
      email,
      telefone: input.telefone.trim(),
      passwordHash,
      loginMethod: "local",
      lastSignedIn: new Date(),
      role: "user",
    },
  });

  const sessionToken = await sdk.signSession(
    {
      openId: user.openId,
      appId: "local",
      name: user.name || user.email || "User",
    },
    { expiresInMs: ONE_YEAR_MS }
  );

  const response = NextResponse.json({ success: true });
  response.headers.append("Set-Cookie", buildSessionCookie(sessionToken, req));
  return response;
}
