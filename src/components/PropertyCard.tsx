import Image from "next/image";
import Link from "next/link";
import { formatPrice, type PriceInput } from "@/lib/format";

type PropertyCardProps = {
  property: {
    id: number;
    title: string;
    city: string;
    state: string;
    price: PriceInput;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number | null;
    images: { imageUrl: string }[];
  };
};

export default function PropertyCard({ property }: PropertyCardProps) {
  const imageUrl = property.images[0]?.imageUrl;

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative h-44 w-full overflow-hidden bg-zinc-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
            Image coming soon
          </div>
        )}
      </div>
      <div className="space-y-4 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {property.city}, {property.state}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-900">
            {property.title}
          </h3>
        </div>
        <div className="flex items-center justify-between text-sm text-zinc-600">
          <span>{property.bedrooms} beds</span>
          <span>{property.bathrooms} baths</span>
          <span>
            {property.squareFeet ? `${property.squareFeet} sqft` : "N/A"}
          </span>
        </div>
        <div className="text-lg font-semibold text-zinc-900">
          {formatPrice(property.price)}
        </div>
      </div>
    </Link>
  );
}
