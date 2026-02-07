import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { MapPin, Search, Filter, X, Scale } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import AmenityFilter from "@/components/AmenityFilter";
import { type AmenityId } from "@shared/amenities";
import SavedSearches from "@/components/SavedSearches";

export default function Properties() {
  const { isAuthenticated } = useAuth();
  const { data: allProperties, isLoading } = trpc.properties.getAll.useQuery();
  const utils = trpc.useUtils();
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

  const { data: userComparison = [] } = trpc.comparisons.getAll.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

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
    return userComparison.some((p) => p.id === propertyId);
  };

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    if (!allProperties) return [];

    return allProperties.filter((property: any) => {
      const matchesSearch =
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.state.toLowerCase().includes(searchTerm.toLowerCase());

      const price = Number(property.price);
      const minPrice = filters.minPrice ? Number(filters.minPrice) : 0;
      const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
      const matchesPrice = price >= minPrice && price <= maxPrice;

      const matchesBedrooms = !filters.bedrooms || property.bedrooms >= Number(filters.bedrooms);
      const matchesBathrooms = !filters.bathrooms || property.bathrooms >= Number(filters.bathrooms);
      const matchesType = !filters.propertyType || property.propertyType === filters.propertyType;

      // Check amenities filter
      let matchesAmenities = true;
      if (selectedAmenities.length > 0) {
        if (!property.amenities || typeof property.amenities !== "object") {
          matchesAmenities = false;
        } else {
          const propAmenities = Array.isArray(property.amenities)
            ? property.amenities
            : Object.values(property.amenities);
          matchesAmenities = selectedAmenities.every((amenity) =>
            propAmenities.some(
              (a: any) =>
                typeof a === "string" &&
                a.toLowerCase().includes(amenity.toLowerCase())
            )
          );
        }
      }

      return matchesSearch && matchesPrice && matchesBedrooms && matchesBathrooms && matchesType && matchesAmenities;
    });
  }, [allProperties, searchTerm, filters, selectedAmenities]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page Header */}
      <section className="border-b border-border bg-card/50 py-8">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">Properties</h1>
          <p className="text-muted-foreground">Browse our complete collection of available properties</p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="border-b border-border bg-background py-6 sticky top-16 z-40">
        <div className="container space-y-4">
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by location, property name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <span className="hidden sm:inline">Filters</span>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Property Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Property Type</label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange("propertyType", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">All Types</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Price</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Price</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Bedrooms</label>
                  <input
                    type="number"
                    placeholder="Bedrooms"
                    value={filters.bedrooms}
                    onChange={(e) => handleFilterChange("bedrooms", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Bathrooms</label>
                  <input
                    type="number"
                    placeholder="Bathrooms"
                    value={filters.bathrooms}
                    onChange={(e) => handleFilterChange("bathrooms", e.target.value)}
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
                    Reset
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
              Showing <span className="font-semibold text-foreground">{filteredProperties.length}</span> properties
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">No properties found matching your criteria</p>
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property: any) => (
                <Link key={property.id} href={`/property/${property.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col group">
                    {/* Property Image Placeholder */}
                    <div className="w-full h-48 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:from-accent/30 group-hover:to-accent/10 transition-colors">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 text-accent/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Property Image</p>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2 flex-1">{property.title}</h3>
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
                          <p className="text-xs text-muted-foreground">Beds</p>
                          <p className="font-semibold text-lg">{property.bedrooms}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Baths</p>
                          <p className="font-semibold text-lg">{property.bathrooms}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Sqft</p>
                          <p className="font-semibold text-lg">{property.squareFeet?.toLocaleString() || "N/A"}</p>
                        </div>
                      </div>

                      <div className="mt-auto space-y-3">
                        <p className="text-2xl font-bold text-accent">
                          ${Number(property.price).toLocaleString()}
                        </p>
                        <Button className="w-full bg-accent hover:bg-accent/90">
                          View Details
                        </Button>
                        {isAuthenticated && (
                          <Button
                            variant={isInComparison(property.id) ? "default" : "outline"}
                            className="w-full gap-2"
                            onClick={(e) => {
                              e.preventDefault();
                              if (isInComparison(property.id)) {
                                removeFromComparison.mutate({ propertyId: property.id });
                              } else {
                                addToComparison.mutate({ propertyId: property.id });
                              }
                            }}
                          >
                            <Scale className="w-4 h-4" />
                            {isInComparison(property.id) ? "In Comparison" : "Compare"}
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
          <p>&copy; 2026 RealEstate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
