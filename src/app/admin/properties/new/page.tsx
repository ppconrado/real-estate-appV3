import Link from "next/link";
import { type $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "New Property | RealEstate",
  description: "Create a new property listing.",
};

export default function NewPropertyPage() {
  async function createProperty(formData: FormData) {
    "use server";

    const title = readString(formData, "title");
    const address = readString(formData, "address");
    const city = readString(formData, "city");
    const state = readString(formData, "state");
    const zipCode = readString(formData, "zipCode");
    const price = readNumber(formData, "price");
    const bedrooms = readNumber(formData, "bedrooms");
    const bathrooms = readNumber(formData, "bathrooms");
    const squareFeet = readOptionalNumber(formData, "squareFeet");
    const propertyType = readEnum(
      formData,
      "propertyType",
      propertyTypes,
      "house"
    );
    const status = readEnum(formData, "status", propertyStatuses, "available");
    const description = readOptionalString(formData, "description");
    const amenities = readOptionalString(formData, "amenities")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);
    const imageUrl = readOptionalString(formData, "imageUrl");

    if (
      !title ||
      !address ||
      !city ||
      !state ||
      !zipCode ||
      !Number.isFinite(price) ||
      !Number.isFinite(bedrooms) ||
      !Number.isFinite(bathrooms)
    ) {
      return;
    }

    const property = await prisma.property.create({
      data: {
        title,
        address,
        city,
        state,
        zipCode,
        price,
        bedrooms,
        bathrooms,
        squareFeet,
        description,
        propertyType: propertyType as $Enums.PropertyType,
        status: status as $Enums.PropertyStatus,
        amenities,
      },
    });

    if (imageUrl) {
      await prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          imageUrl,
          displayOrder: 1,
        },
      });
    }

    redirect("/admin/properties");
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-10">
          <p className="text-sm uppercase tracking-wide text-zinc-500">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
            New property
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Add a listing to the marketplace catalog.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-10">
        <form className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="title"
              placeholder="Title"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="price"
              placeholder="Price"
              type="number"
              step="0.01"
              min="0"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
          </div>

          <textarea
            name="description"
            placeholder="Description"
            className="min-h-30 rounded-xl border border-zinc-200 px-4 py-3 text-sm"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="address"
              placeholder="Address"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="city"
              placeholder="City"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="state"
              placeholder="State"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="zipCode"
              placeholder="ZIP code"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="bedrooms"
              placeholder="Bedrooms"
              type="number"
              min="0"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="bathrooms"
              placeholder="Bathrooms"
              type="number"
              min="0"
              step="0.5"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="squareFeet"
              placeholder="Square feet"
              type="number"
              min="0"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              name="propertyType"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              defaultValue="house"
            >
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
            </select>
            <select
              name="status"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              defaultValue="available"
            >
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <input
            name="amenities"
            placeholder="Amenities (comma separated)"
            className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
          />
          <input
            name="imageUrl"
            placeholder="Primary image URL"
            className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
          />

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/properties"
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600"
            >
              Cancel
            </Link>
            <button
              formAction={createProperty}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Save property
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

const propertyTypes = new Set([
  "house",
  "apartment",
  "condo",
  "townhouse",
  "land",
  "commercial",
]);

const propertyStatuses = new Set(["available", "pending", "sold"]);

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  return readString(formData, key);
}

function readNumber(formData: FormData, key: string) {
  const raw = readString(formData, key);
  if (!raw) return Number.NaN;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function readOptionalNumber(formData: FormData, key: string) {
  const parsed = readNumber(formData, key);
  return Number.isFinite(parsed) ? parsed : null;
}

function readEnum(
  formData: FormData,
  key: string,
  allowed: Set<string>,
  fallback: string
) {
  const value = readString(formData, key);
  return allowed.has(value) ? value : fallback;
}
