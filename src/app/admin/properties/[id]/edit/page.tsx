import Image from "next/image";
import Link from "next/link";
import { PropertyStatus, PropertyType } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import DeleteImageForm from "@/components/admin/DeleteImageForm";
import ImageReorderList from "@/components/admin/ImageReorderList";
import ImageUploadForm from "@/components/admin/ImageUploadForm";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Edit Property | RealEstate",
  description: "Edit a property listing.",
};

type PageProps = {
  params: { id: string };
};

export default async function EditPropertyPage({ params }: PageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: { displayOrder: "asc" } } },
  });

  if (!property) {
    notFound();
  }

  const amenities = Array.isArray(property.amenities)
    ? property.amenities.join(", ")
    : "";
  const maxUploadMb = Number(process.env.UPLOAD_MAX_MB ?? "8") || 8;

  async function updateProperty(formData: FormData) {
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
    const amenitiesInput = readOptionalString(formData, "amenities")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);

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

    await prisma.property.update({
      where: { id },
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
        propertyType: propertyType as PropertyType,
        status: status as PropertyStatus,
        amenities: amenitiesInput,
      },
    });

    redirect("/admin/properties");
  }

  async function addImage(formData: FormData) {
    "use server";

    const imageUrl = readString(formData, "imageUrl");
    if (!imageUrl) {
      return;
    }

    const lastImage = await prisma.propertyImage.findFirst({
      where: { propertyId: id },
      orderBy: { displayOrder: "desc" },
    });
    const nextOrder = lastImage ? lastImage.displayOrder + 1 : 1;

    await prisma.propertyImage.create({
      data: { propertyId: id, imageUrl, displayOrder: nextOrder },
    });

    redirect(`/admin/properties/${id}/edit`);
  }

  async function removeImage(formData: FormData) {
    "use server";

    const imageId = Number(formData.get("imageId"));
    if (!Number.isFinite(imageId)) {
      return;
    }

    await prisma.propertyImage.delete({ where: { id: imageId } });
    await normalizeImageOrder(id);
    redirect(`/admin/properties/${id}/edit`);
  }

  async function moveImage(formData: FormData) {
    "use server";

    const imageId = Number(formData.get("imageId"));
    const direction = readString(formData, "direction");
    if (!Number.isFinite(imageId) || !direction) {
      return;
    }

    const images = await prisma.propertyImage.findMany({
      where: { propertyId: id },
      orderBy: { displayOrder: "asc" },
    });
    const currentIndex = images.findIndex(image => image.id === imageId);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= images.length) {
      return;
    }

    const currentImage = images[currentIndex];
    const nextImage = images[nextIndex];

    await prisma.$transaction([
      prisma.propertyImage.update({
        where: { id: currentImage.id },
        data: { displayOrder: nextImage.displayOrder },
      }),
      prisma.propertyImage.update({
        where: { id: nextImage.id },
        data: { displayOrder: currentImage.displayOrder },
      }),
    ]);

    redirect(`/admin/properties/${id}/edit`);
  }

  async function updateImageCaption(formData: FormData) {
    "use server";

    const imageId = Number(formData.get("imageId"));
    const caption = readString(formData, "caption");
    if (!Number.isFinite(imageId)) {
      return;
    }

    await prisma.propertyImage.update({
      where: { id: imageId },
      data: { caption: caption || null },
    });

    redirect(`/admin/properties/${id}/edit`);
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-10">
          <p className="text-sm uppercase tracking-wide text-zinc-500">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
            Edit property
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Update listing details and imagery.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-10">
        <form className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="title"
              placeholder="Title"
              defaultValue={property.title}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="price"
              placeholder="Price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={property.price.toString()}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
          </div>

          <textarea
            name="description"
            placeholder="Description"
            defaultValue={property.description ?? ""}
            className="min-h-30 rounded-xl border border-zinc-200 px-4 py-3 text-sm"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="address"
              placeholder="Address"
              defaultValue={property.address}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="city"
              placeholder="City"
              defaultValue={property.city}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="state"
              placeholder="State"
              defaultValue={property.state}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="zipCode"
              placeholder="ZIP code"
              defaultValue={property.zipCode}
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
              defaultValue={property.bedrooms}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="bathrooms"
              placeholder="Bathrooms"
              type="number"
              min="0"
              step="0.5"
              defaultValue={property.bathrooms}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
            <input
              name="squareFeet"
              placeholder="Square feet"
              type="number"
              min="0"
              defaultValue={property.squareFeet ?? ""}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              name="propertyType"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              defaultValue={property.propertyType}
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
              defaultValue={property.status}
            >
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <input
            name="amenities"
            placeholder="Amenities (comma separated)"
            defaultValue={amenities}
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
              formAction={updateProperty}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Update property
            </button>
          </div>
        </form>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Images</h2>
              <p className="text-sm text-zinc-600">
                Add, reorder, or remove listing photos.
              </p>
            </div>
            <form action={addImage} className="flex gap-2">
              <input
                name="imageUrl"
                placeholder="Image URL"
                className="w-full min-w-55 rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add
              </button>
            </form>
          </div>

          <ImageUploadForm propertyId={property.id} maxMb={maxUploadMb} />

          {property.images.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
              No images yet. Add the first image URL.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {property.images.map((image, index) => (
                <div
                  key={image.id}
                  className="rounded-xl border border-zinc-200 p-4"
                >
                  <div className="relative h-44 overflow-hidden rounded-lg bg-zinc-100">
                    <Image
                      src={image.imageUrl}
                      alt={property.title}
                      fill
                      sizes="(min-width: 768px) 240px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <form action={updateImageCaption} className="mt-3 space-y-2">
                    <input type="hidden" name="imageId" value={image.id} />
                    <input
                      name="caption"
                      placeholder="Caption (optional)"
                      defaultValue={image.caption ?? ""}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-200 px-3 py-1 text-xs text-zinc-600"
                    >
                      Save caption
                    </button>
                  </form>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <form action={moveImage}>
                      <input type="hidden" name="imageId" value={image.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-200 px-3 py-1 text-zinc-600 disabled:opacity-50"
                        disabled={index === 0}
                      >
                        Move up
                      </button>
                    </form>
                    <form action={moveImage}>
                      <input type="hidden" name="imageId" value={image.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-200 px-3 py-1 text-zinc-600 disabled:opacity-50"
                        disabled={index === property.images.length - 1}
                      >
                        Move down
                      </button>
                    </form>
                    <DeleteImageForm imageId={image.id} action={removeImage} />
                    <span className="text-xs text-zinc-400">
                      Order {image.displayOrder}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {property.images.length > 1 ? (
            <ImageReorderList
              propertyId={property.id}
              images={property.images}
            />
          ) : null}
        </div>
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

async function normalizeImageOrder(propertyId: number) {
  const images = await prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: { displayOrder: "asc" },
  });

  const updates = images.map((image, index) =>
    prisma.propertyImage.update({
      where: { id: image.id },
      data: { displayOrder: index + 1 },
    })
  );

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
}
