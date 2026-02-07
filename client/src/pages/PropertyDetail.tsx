import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Bed, Bath, Ruler, Heart, Share2, Phone, Mail } from "lucide-react";
import { useRoute } from "wouter";
import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ImageGallery from "@/components/ImageGallery";
import ViewingScheduler from "@/components/ViewingScheduler";

export default function PropertyDetail() {
  const [, params] = useRoute("/property/:id");
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const propertyId = params?.id ? parseInt(params.id) : 0;

  // Fetch property images
  const { data: propertyImages = [] } = trpc.images.getPropertyImages.useQuery(
    { propertyId },
    { enabled: propertyId > 0 }
  );

  // Mock property data - in real app would fetch from API
  const property = {
    id: params?.id,
    title: "Luxury Modern Home in Prime Location",
    price: 2500000,
    propertyType: "house",
    bedrooms: 5,
    bathrooms: 4,
    squareFeet: 5200,
    address: "123 Oak Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    latitude: 37.7749,
    longitude: -122.4194,
    description: "Stunning modern home with panoramic city views, premium finishes, and smart home technology. Perfect for discerning buyers seeking luxury and convenience.",
    amenities: ["Swimming Pool", "Home Theater", "Smart Home", "Hardwood Floors", "Granite Counters", "Stainless Steel Appliances", "Walk-in Closets", "Spa Bathroom"],
    featured: true,
    status: "available",
  };

  // Use uploaded images if available, otherwise use mock images
  const displayImages = propertyImages && propertyImages.length > 0 
    ? propertyImages.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        caption: img.caption || undefined,
      }))
    : [
        { id: 1, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop", caption: "Front view" },
        { id: 2, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop", caption: "Living room" },
        { id: 3, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop", caption: "Master bedroom" },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Image Gallery */}
      <section className="w-full bg-card border-b border-border">
        <div className="container py-6">
          <ImageGallery images={displayImages} title={property.title} />
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Property Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
                    <p className="text-lg text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {property.address}, {property.city}, {property.state} {property.zipCode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsFavorited(!isFavorited)}
                      className={isFavorited ? "text-accent" : ""}
                    >
                      <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="text-4xl font-bold text-accent mb-4">
                  ${property.price.toLocaleString()}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Bed className="w-5 h-5 text-accent" />
                      <span className="text-2xl font-bold">{property.bedrooms}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Bath className="w-5 h-5 text-accent" />
                      <span className="text-2xl font-bold">{property.bathrooms}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Ruler className="w-5 h-5 text-accent" />
                      <span className="text-2xl font-bold">{(property.squareFeet / 1000).toFixed(1)}k</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Sqft</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl font-bold capitalize">{property.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </Card>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold mb-4">About This Property</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">{property.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Placeholder */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Location</h2>
                <div className="w-full h-96 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-accent/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">Interactive Map Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact & CTA */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="p-6 space-y-4 sticky top-20">
                <h3 className="text-xl font-bold">Interested in This Property?</h3>

                <ViewingScheduler propertyId={propertyId} propertyTitle={property.title} />
                <Button variant="outline" className="w-full h-12">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Inquiry
                </Button>

                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold mb-3">Agent Information</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">John Smith</span>
                      <br />
                      Real Estate Agent
                    </p>
                    <p className="text-muted-foreground">
                      <Phone className="w-4 h-4 inline mr-2" />
                      (555) 123-4567
                    </p>
                    <p className="text-muted-foreground">
                      <Mail className="w-4 h-4 inline mr-2" />
                      john@realestate.com
                    </p>
                  </div>
                </div>
              </Card>

              {/* Property Stats */}
              <Card className="p-6 space-y-4">
                <h3 className="font-bold">Property Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property Type</span>
                    <span className="font-medium capitalize">{property.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year Built</span>
                    <span className="font-medium">2020</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lot Size</span>
                    <span className="font-medium">0.75 acres</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HOA Fees</span>
                    <span className="font-medium">$500/month</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
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
