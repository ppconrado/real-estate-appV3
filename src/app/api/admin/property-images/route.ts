import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const expectedToken = process.env.ADMIN_ACCESS_TOKEN;
  const providedToken = request.cookies.get("admin_token")?.value;

  if (!expectedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const propertyId = Number(formData.get("propertyId"));
  const file = formData.get("file");

  if (!Number.isFinite(propertyId)) {
    return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 415 });
  }

  const maxMb = Number(process.env.UPLOAD_MAX_MB ?? "8");
  const maxBytes = Number.isFinite(maxMb) && maxMb > 0 ? maxMb * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name || `property-${propertyId}-${Date.now()}`;

  const imageUrl = await uploadImage(buffer, fileName);
  const lastImage = await prisma.propertyImage.findFirst({
    where: { propertyId },
    orderBy: { displayOrder: "desc" },
  });
  const nextOrder = lastImage ? lastImage.displayOrder + 1 : 1;

  await prisma.propertyImage.create({
    data: { propertyId, imageUrl, displayOrder: nextOrder },
  });

  const redirectUrl = new URL(`/admin/properties/${propertyId}/edit`, request.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
