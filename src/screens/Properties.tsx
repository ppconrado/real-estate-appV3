"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { MapPin, Search, Filter, X, Scale } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import AmenityFilter from "@/components/AmenityFilter";
import { type AmenityId } from "@/shared/amenities";
import SavedSearches from "@/components/SavedSearches";
import { Slider } from "@/components/ui/slider";

function PropertyCardImage({
  imageUrl,
  title,
}: {
  imageUrl?: string;
  title: string;
}) {
  if (!imageUrl) {
    return (
      <div className="w-full h-48 bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:from-accent/30 group-hover:to-accent/10 transition-colors">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-accent/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Property Image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-48 bg-muted overflow-hidden">
      <img
        src={imageUrl}
        alt={title}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export default function Properties() {
  const { isAuthenticated } = useAuth();
  const { data: allPropertiesRaw, isLoading } =
    trpc.properties.getAll.useQuery();

  // Unwrap SuperJSON envelope if present
  const allProperties = useMemo(() => {
    if (!allPropertiesRaw) return [];
    if (
      typeof allPropertiesRaw === "object" &&
      "json" in allPropertiesRaw &&
      "meta" in allPropertiesRaw
    ) {
      const unwrapped = (allPropertiesRaw as any).json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(allPropertiesRaw) ? allPropertiesRaw : [];
  }, [allPropertiesRaw]);
  const propertyList = Array.isArray(allProperties) ? allProperties : [];
  const utils = trpc.useUtils();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    bathrooms: "",
    propertyType: "",
  });
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityId[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [hasInitializedFromUrl, setHasInitializedFromUrl] = useState(false);

  const { data: userComparisonRaw } = trpc.comparisons.getAll.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Unwrap SuperJSON envelope if present
  const userComparison = useMemo(() => {
    if (!userComparisonRaw) return [];
    if (
      typeof userComparisonRaw === "object" &&
      "json" in userComparisonRaw &&
      "meta" in userComparisonRaw
    ) {
      const unwrapped = (userComparisonRaw as any).json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(userComparisonRaw) ? userComparisonRaw : [];
  }, [userComparisonRaw]);

  const addToComparison = trpc.comparisons.add.useMutation({
    onSuccess: () => {
      utils.comparisons.getAll.invalidate();
      toast.success("Property added to comparison");
    },
  });

  const removeFromComparison = trpc.comparisons.remove.useMutation({
    onSuccess: () => {
      utils.comparisons.getAll.invalidate();
      toast.success("Property removed from comparison");
    },
  });

  const isInComparison = (propertyId: number) => {
    if (!Array.isArray(userComparison)) return false;
    return userComparison.some(p => p.id === propertyId);
  };

  const priceBounds = useMemo(() => {
    if (propertyList.length === 0) {
      return { min: 0, max: 1000000 };
    }
    const prices = propertyList
      .map((property: any) => Number(property.price))
      .filter(price => !Number.isNaN(price));
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 1000000;
    return { min, max: Math.max(max, min + 1) };
  }, [propertyList]);

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    if (propertyList.length === 0) return [];

    return propertyList.filter((property: any) => {
      const matchesSearch =
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.state.toLowerCase().includes(searchTerm.toLowerCase());

      const price = Number(property.price);
      const minPrice = filters.minPrice ? Number(filters.minPrice) : 0;
      const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
      const matchesPrice = price >= minPrice && price <= maxPrice;

      const matchesBedrooms =
        !filters.bedrooms || property.bedrooms >= Number(filters.bedrooms);
      const matchesBathrooms =
        !filters.bathrooms || property.bathrooms >= Number(filters.bathrooms);
      const matchesType =
        !filters.propertyType || property.propertyType === filters.propertyType;

      // Check amenities filter
      let matchesAmenities = true;
      if (selectedAmenities.length > 0) {
        if (!property.amenities || typeof property.amenities !== "object") {
          matchesAmenities = false;
        } else {
          const propAmenities = Array.isArray(property.amenities)
            ? property.amenities
            : Object.values(property.amenities);
          matchesAmenities = selectedAmenities.every(amenity =>
            propAmenities.some(
              (a: any) =>
                typeof a === "string" &&
                a.toLowerCase().includes(amenity.toLowerCase())
            )
          );
        }
      }

      return (
        matchesSearch &&
        matchesPrice &&
        matchesBedrooms &&
        matchesBathrooms &&
        matchesType &&
        matchesAmenities
      );
    });
  }, [propertyList, searchTerm, filters, selectedAmenities]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const nextFilters = {
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
      bedrooms: params.get("bedrooms") || "",
      bathrooms: params.get("bathrooms") || "",
      propertyType: params.get("propertyType") || "",
    };
    const nextAmenities = (params.get("amenities") || "")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean) as AmenityId[];
    const nextSearch = params.get("q") || "";

    const sameFilters =
      nextFilters.minPrice === filters.minPrice &&
      nextFilters.maxPrice === filters.maxPrice &&
      nextFilters.bedrooms === filters.bedrooms &&
      nextFilters.bathrooms === filters.bathrooms &&
      nextFilters.propertyType === filters.propertyType &&
      nextSearch === searchTerm &&
      nextAmenities.join(",") === selectedAmenities.join(",");

    if (!sameFilters) {
      setFilters(nextFilters);
      setSelectedAmenities(nextAmenities);
      setSearchTerm(nextSearch);
      setShowFilters(
        Boolean(
          nextFilters.minPrice ||
          nextFilters.maxPrice ||
          nextFilters.bedrooms ||
          nextFilters.bathrooms ||
          nextFilters.propertyType ||
          nextAmenities.length > 0
        )
      );
    }

    setHasInitializedFromUrl(true);
  }, [searchParams]);

  useEffect(() => {
    if (!hasInitializedFromUrl) return;
    if (pathname !== "/properties") return;
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
    if (filters.bathrooms) params.set("bathrooms", filters.bathrooms);
    if (filters.propertyType) params.set("propertyType", filters.propertyType);
    if (selectedAmenities.length > 0)
      params.set("amenities", selectedAmenities.join(","));
    const query = params.toString();
    router.replace(query ? `/properties?${query}` : "/properties", {
      scroll: false,
    });
  }, [
    filters,
    searchTerm,
    selectedAmenities,
    hasInitializedFromUrl,
    pathname,
    router,
  ]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === "minPrice" || key === "maxPrice") {
        const min = next.minPrice ? Number(next.minPrice) : priceBounds.min;
        const max = next.maxPrice ? Number(next.maxPrice) : priceBounds.max;
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
          setPriceRange([
            Math.max(priceBounds.min, Math.min(min, max)),
            Math.min(priceBounds.max, Math.max(min, max)),
          ]);
        }
      }
      return next;
    });
  };

  const resetFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      bathrooms: "",
      propertyType: "",
    });
    setSearchTerm("");
    setSelectedAmenities([]);
    setPriceRange([priceBounds.min, priceBounds.max]);
  };

  const handleLoadSearch = (loadedFilters: any) => {
    setFilters({
      minPrice: loadedFilters.minPrice || "",
      maxPrice: loadedFilters.maxPrice || "",
      bedrooms: loadedFilters.bedrooms || "",
      bathrooms: loadedFilters.bathrooms || "",
      propertyType: loadedFilters.propertyType || "",
    });
    setSelectedAmenities(loadedFilters.amenities || []);
    setShowFilters(true);
  };

  useEffect(() => {
    if (!hasInitializedFromUrl) return;
    const min = filters.minPrice ? Number(filters.minPrice) : priceBounds.min;
    const max = filters.maxPrice ? Number(filters.maxPrice) : priceBounds.max;
    if (Number.isNaN(min) || Number.isNaN(max)) return;
    const nextRange: [number, number] = [
      Math.max(priceBounds.min, Math.min(min, max)),
      Math.min(priceBounds.max, Math.max(min, max)),
    ];
    setPriceRange(prev =>
      prev[0] === nextRange[0] && prev[1] === nextRange[1] ? prev : nextRange
    );
  }, [filters.minPrice, filters.maxPrice, priceBounds, hasInitializedFromUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page Header */}
      <section className="border-b border-border bg-card/50 py-8">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">Propriedades</h1>
          <p className="text-muted-foreground">
            Explore nossa coleção completa de propriedades disponíveis
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="border-b border-border bg-background py-6 sticky top-16 z-40">
        <div className="container space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Explore por localização, nome da propriedade..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
            {isAuthenticated && (
              <SavedSearches
                onLoadSearch={handleLoadSearch}
                currentFilters={{ ...filters, amenities: selectedAmenities }}
              />
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Property Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tipo de Propriedade
                  </label>
                  <select
                    value={filters.propertyType}
                    onChange={e =>
                      handleFilterChange("propertyType", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Todos os Tipos</option>
                    <option value="house">Casa</option>
                    <option value="apartment">Apartamento</option>
                    <option value="condo">Condomínio</option>
                    <option value="townhouse">Casa Geminada</option>
                    <option value="land">Terreno</option>
                    <option value="commercial">Comercial</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="text-sm font-medium mb-2 block">
                    Faixa de Preço
                  </label>
                  <div className="space-y-3">
                    <Slider
                      min={priceBounds.min}
                      max={priceBounds.max}
                      step={10000}
                      value={priceRange}
                      onValueChange={value => {
                        const [min, max] = value as [number, number];
                        setPriceRange([min, max]);
                        handleFilterChange("minPrice", String(min));
                        handleFilterChange("maxPrice", String(max));
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>${Math.round(priceRange[0]).toLocaleString()}</span>
                      <span>${Math.round(priceRange[1]).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={e =>
                          handleFilterChange("minPrice", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={e =>
                          handleFilterChange("maxPrice", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Min Quartos
                  </label>
                  <input
                    type="number"
                    placeholder="Quantidade mínima de quartos"
                    value={filters.bedrooms}
                    onChange={e =>
                      handleFilterChange("bedrooms", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Min Banheiros
                  </label>
                  <input
                    type="number"
                    placeholder="Quantidade mínima de banheiros"
                    value={filters.bathrooms}
                    onChange={e =>
                      handleFilterChange("bathrooms", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="w-full gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reiniciar filtros
                  </Button>
                </div>
              </div>

              {/* Amenity Filter */}
              <div className="border-t border-border pt-4">
                <AmenityFilter
                  selectedAmenities={selectedAmenities}
                  onChange={setSelectedAmenities}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="flex-1 py-12">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              Mostrando{" "}
              <span className="font-semibold text-foreground">
                {filteredProperties.length}
              </span>{" "}
              propriedades
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="h-96 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                Nenhuma propriedade encontrada correspondendo aos seus critérios
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property: any) => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col group">
                    {/* Property Image Placeholder */}
                    <PropertyCardImage
                      imageUrl={property.images?.[0]?.imageUrl}
                      title={property.title}
                    />

                    {/* Property Info */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                          {property.title}
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/10 text-accent ml-2 whitespace-nowrap">
                          {property.propertyType}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {property.city}, {property.state}
                      </p>

                      <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-t border-b border-border">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            Quartos
                          </p>
                          <p className="font-semibold text-lg">
                            {property.bedrooms}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            Banheiros
                          </p>
                          <p className="font-semibold text-lg">
                            {property.bathrooms}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            Área (m)
                          </p>
                          <p className="font-semibold text-lg">
                            {property.squareFeet?.toLocaleString() || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto space-y-3">
                        <p className="text-2xl font-bold text-accent">
                          ${Number(property.price).toLocaleString()}
                        </p>
                        <Button className="w-full bg-accent hover:bg-accent/90">
                          Ver Detalhes
                        </Button>
                        {isAuthenticated && (
                          <Button
                            variant={
                              isInComparison(property.id)
                                ? "default"
                                : "outline"
                            }
                            className="w-full gap-2"
                            onClick={e => {
                              e.preventDefault();
                              if (isInComparison(property.id)) {
                                removeFromComparison.mutate({
                                  propertyId: property.id,
                                });
                              } else {
                                addToComparison.mutate({
                                  propertyId: property.id,
                                });
                              }
                            }}
                          >
                            <Scale className="w-4 h-4" />
                            {isInComparison(property.id)
                              ? "Em Comparação"
                              : "Comparar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 SaborRifaina. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
