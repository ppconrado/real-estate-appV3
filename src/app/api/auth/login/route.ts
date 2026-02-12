import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildSessionCookie } from "@/server/auth/cookies";
import { sdk } from "@/server/auth/sdk";
import { ONE_YEAR_MS } from "@/shared/const";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function POST(req: NextRequest) {
  let input: z.infer<typeof loginSchema>;
  try {
    input = loginSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Email invalido. Verifique o formulario." },
      { status: 400 }
    );
  }

  const email = normalizeEmail(input.email);
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Conta nao encontrada ou sem senha. Faca o registro." },
      { status: 404 }
    );
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastSignedIn: new Date(),
      loginMethod: user.loginMethod ?? "local",
    },
  });

  const sessionToken = await sdk.signSession(
    {
      openId: updatedUser.openId,
      appId: "local",
      name: updatedUser.name || updatedUser.email || "User",
    },
    { expiresInMs: ONE_YEAR_MS }
  );

  const response = NextResponse.json({ success: true });
  response.headers.append("Set-Cookie", buildSessionCookie(sessionToken, req));
  return response;
}
