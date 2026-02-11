import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Payload = {
  propertyId: number;
  orderedImageIds: number[];
};

export async function POST(request: NextRequest) {
  const expectedToken = process.env.ADMIN_ACCESS_TOKEN;
  const providedToken = request.cookies.get("admin_token")?.value;

  if (!expectedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { propertyId, orderedImageIds } = payload;
  if (!Number.isFinite(propertyId) || !Array.isArray(orderedImageIds)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const uniqueIds = Array.from(new Set(orderedImageIds));
  if (uniqueIds.length !== orderedImageIds.length) {
    return NextResponse.json({ error: "Duplicate image ids" }, { status: 400 });
  }

  const images = await prisma.propertyImage.findMany({
    where: { propertyId },
    select: { id: true },
  });
  const validIds = new Set(images.map(image => image.id));

  if (orderedImageIds.some(id => !validIds.has(id))) {
    return NextResponse.json(
      { error: "Invalid image selection" },
      { status: 400 }
    );
  }

  const updates = orderedImageIds.map((id, index) =>
    prisma.propertyImage.update({
      where: { id },
      data: { displayOrder: index + 1 },
    })
  );

  await prisma.$transaction(updates);

  return NextResponse.json({ ok: true });
}
