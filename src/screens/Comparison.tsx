"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, Share2, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Comparison() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: comparisonPropertiesRaw, isLoading } =
    trpc.comparisons.getAll.useQuery(undefined, { enabled: isAuthenticated });

  // Unwrap SuperJSON envelope if present
  const comparisonProperties = useMemo(() => {
    if (!comparisonPropertiesRaw) return [];
    if (
      typeof comparisonPropertiesRaw === "object" &&
      "json" in comparisonPropertiesRaw &&
      "meta" in comparisonPropertiesRaw
    ) {
      const unwrapped = (comparisonPropertiesRaw as any).json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(comparisonPropertiesRaw)
      ? comparisonPropertiesRaw
      : [];
  }, [comparisonPropertiesRaw]);

  const removeFromComparison = trpc.comparisons.remove.useMutation({
    onSuccess: () => {
      utils.comparisons.getAll.invalidate();
      toast.success("Property removed from comparison");
    },
  });

  const clearComparison = trpc.comparisons.clear.useMutation({
    onSuccess: () => {
      utils.comparisons.getAll.invalidate();
      toast.success("Comparison cleared");
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to compare properties.
            </p>
            <Button className="w-full bg-accent hover:bg-accent/90">
              Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            <p className="mt-4 text-muted-foreground">Loading comparison...</p>
          </div>
        </div>
      </div>
    );
  }

  if (comparisonProperties.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              No Properties to Compare
            </h2>
            <p className="text-muted-foreground mb-6">
              Add properties to your comparison list to see them side-by-side.
            </p>
            <Button
              onClick={() => router.push("/properties")}
              className="w-full bg-accent hover:bg-accent/90"
            >
              Browse Properties
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="flex-1 py-12">
        <div className="container">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Property Comparison</h1>
              <p className="text-muted-foreground">
                Comparing {comparisonProperties.length} properties
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="destructive"
                onClick={() => clearComparison.mutate()}
                disabled={clearComparison.isPending}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Comparison Table - Horizontal Scroll on Mobile */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-6 py-4 text-left font-semibold text-foreground sticky left-0 bg-card z-10 min-w-[200px]">
                    Property Details
                  </th>
                  {comparisonProperties.map(property => (
                    <th
                      key={property.id}
                      className="px-6 py-4 text-left font-semibold text-foreground min-w-[280px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-base truncate">
                            {property.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {property.city}, {property.state}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            removeFromComparison.mutate({
                              propertyId: property.id,
                            })
                          }
                          className="p-1 hover:bg-destructive/10 rounded transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price */}
                <tr className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-background z-10">
                    Price
                  </td>
                  {comparisonProperties.map(property => (
                    <td key={property.id} className="px-6 py-4">
                      <div className="text-2xl font-bold text-accent">
                        $
                        {parseFloat(property.price.toString()).toLocaleString()}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Property Type */}
                <tr className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-background z-10">
                    Property Type
                  </td>
                  {comparisonProperties.map(property => (
                    <td key={property.id} className="px-6 py-4">
                      <span className="capitalize px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                        {property.propertyType}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Bedrooms */}
                <tr className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-background z-10">
                    Bedrooms
                  </td>
                  {comparisonProperties.map(property => (
                    <td key={property.id} className="px-6 py-4">
                      <div className="text-lg font-semibold">
                        {property.bedrooms}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Bathrooms */}
                <tr className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-background z-10">
                    Bathrooms
                  </td>
                  {comparisonProperties.map(property => (
                    <td key={property.id} className="px-6 py-4">
                      <div className="text-lg font-semibold">
                        {property.bathrooms}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Square Feet */}
                <tr className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-background z-10">
                    Square Feet
                  </td>
                  {comparisonProperties.map(property => (
                    <td key={property.id} className="px-6 py-4">
                      <div className="text-lg font-semibold">
                        {property.squareFeet?.toLocaleString()} sqft
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Price per Sqft */}
                <tr className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-background z-10">
                    Price per Sqft
                  </td>
                  {comparisonProperties.map(property => {
                    const pricePerSqft = property.squareFeet
                      ? (
                          parseFloat(property.price.toString()) /
                          property.squareFeet
                        ).toFixed(2)
                      : "N/A";
                    return (
                      <td key={property.id} className="px-6 py-4">
                        <div className="text-lg font-semibold">
                          {pricePerSqft !== "N/A"
                            ? `$${pricePerSqft}`
                            : pricePerSqft}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Address */}
                <tr className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-background z-10">
                    Address
                  </td>
                  {comparisonProperties.map(property => (
                    <td key={property.id} className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium">{property.address}</p>
                        <p className="text-muted-foreground">
                          {property.city}, {property.state} {property.zipCode}
                        </p>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Status */}
                <tr className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-background z-10">
                    Status
                  </td>
                  {comparisonProperties.map(property => (
                    <td key={property.id} className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                          property.status === "available"
                            ? "bg-green-100 text-green-800"
                            : property.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {property.status}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Amenities */}
                <tr className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-background z-10">
                    Amenities
                  </td>
                  {comparisonProperties.map(property => (
                    <td key={property.id} className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {property.amenities && property.amenities.length > 0 ? (
                          property.amenities
                            .slice(0, 3)
                            .map((amenity: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-accent/10 text-accent text-xs rounded font-medium"
                              >
                                {amenity}
                              </span>
                            ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            N/A
                          </span>
                        )}
                        {property.amenities &&
                          property.amenities.length > 3 && (
                            <span className="text-muted-foreground text-xs">
                              +{property.amenities.length - 3} more
                            </span>
                          )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr className="bg-card">
                  <td className="px-6 py-4 font-semibold text-foreground sticky left-0 bg-card z-10">
                    Actions
                  </td>
                  {comparisonProperties.map(property => (
                    <td key={property.id} className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/properties/${property.id}`)
                        }
                        className="w-full gap-2"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-6 mt-8">
            {comparisonProperties.map(property => (
              <Card key={property.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{property.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {property.city}, {property.state}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      removeFromComparison.mutate({ propertyId: property.id })
                    }
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-bold text-accent">
                      ${parseFloat(property.price.toString()).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize font-medium">
                      {property.propertyType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bedrooms</span>
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bathrooms</span>
                    <span className="font-medium">{property.bathrooms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Square Feet</span>
                    <span className="font-medium">
                      {property.squareFeet?.toLocaleString()} sqft
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        property.status === "available"
                          ? "bg-green-100 text-green-800"
                          : property.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => router.push(`/properties/${property.id}`)}
                  className="w-full bg-accent hover:bg-accent/90 gap-2"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 RealEstate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
