import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Properties | RealEstate",
  description: "Manage property listings.",
};

export default async function AdminPropertiesPage() {
  async function deleteProperty(formData: FormData) {
    "use server";

    const id = Number(formData.get("propertyId"));
    if (!Number.isFinite(id)) {
      return;
    }

    await prisma.property.delete({ where: { id } });
    revalidatePath("/admin/properties");
  }

  const properties = await prisma.property.findMany({
    include: { images: { orderBy: { displayOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-zinc-500">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
              Property listings
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Track inventory, update prices, and maintain images.
            </p>
          </div>
          <Link
            href="/admin/properties/new"
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Add property
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        {properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            No properties yet. Add the first listing.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map(property => (
                  <tr key={property.id} className="border-t border-zinc-200">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 overflow-hidden rounded-lg bg-zinc-100">
                          {property.images[0]?.imageUrl ? (
                            <Image
                              src={property.images[0].imageUrl}
                              alt={property.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">
                            {property.title}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {property.propertyType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-zinc-600">
                      {property.city}, {property.state}
                    </td>
                    <td className="px-4 py-4 text-zinc-600">
                      {formatPrice(property.price)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs capitalize text-zinc-600">
                        {property.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        <Link
                          href={`/admin/properties/${property.id}/edit`}
                          className="rounded-lg border border-zinc-200 px-3 py-1 text-zinc-600"
                        >
                          Edit
                        </Link>
                        <form action={deleteProperty}>
                          <input
                            type="hidden"
                            name="propertyId"
                            value={property.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-zinc-200 px-3 py-1 text-zinc-600"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
