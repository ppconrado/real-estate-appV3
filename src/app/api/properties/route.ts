import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const properties = await prisma.property.findMany({
    include: { images: { orderBy: { displayOrder: "asc" }, take: 1 } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    properties.map(property => ({
      ...property,
      price: property.price.toString(),
      latitude: property.latitude?.toString() ?? null,
      longitude: property.longitude?.toString() ?? null,
    }))
  );
}
