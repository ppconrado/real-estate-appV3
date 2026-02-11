import { Prisma } from "@prisma/client";

export type PriceInput = Prisma.Decimal | number | string | null | undefined;

export function formatPrice(value: PriceInput) {
  const numeric = normalizePrice(value);
  if (!Number.isFinite(numeric)) {
    return "N/A";
  }

  return numeric.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function normalizePrice(value: PriceInput) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number(value);
  }
  if (value && typeof value === "object" && "toNumber" in value) {
    return value.toNumber();
  }
  return Number.NaN;
}
