import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Eye, Images, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: allProperties, isLoading } = trpc.properties.getAll.useQuery();
  const utils = trpc.useUtils();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedPropertyId, setExpandedPropertyId] = useState<number | null>(null);
  const [uploadingPropertyId, setUploadingPropertyId] = useState<number | null>(null);

  const { data: propertyImages = {} } = trpc.images.getPropertyImages.useQuery(
    { propertyId: expandedPropertyId || 0 },
    { enabled: expandedPropertyId !== null }
  );

  const uploadImages = trpc.images.upload.useMutation({
    onSuccess: () => {
      utils.images.getPropertyImages.invalidate();
      toast.success("Images uploaded successfully");
      setUploadingPropertyId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload images");
    },
  });

  const deleteImage = trpc.images.delete.useMutation({
    onSuccess: () => {
      utils.images.getPropertyImages.invalidate();
      toast.success("Image deleted");
    },
  });

  const handleImageUpload = async (files: Array<{ file: File; caption?: string }>) => {
    if (!uploadingPropertyId) return;

    for (const { file, caption } of files) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        await uploadImages.mutateAsync({
          propertyId: uploadingPropertyId,
          imageData: base64,
          fileName: file.name,
          caption,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to access the admin dashboard.</p>
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page Header */}
      <section className="border-b border-border bg-card/50 py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <Button size="lg" className="bg-accent hover:bg-accent/90 gap-2" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-5 h-5" />
              Add Property
            </Button>
          </div>
          <p className="text-muted-foreground">Manage your property listings and images</p>
        </div>
      </section>

      {/* Add Property Form */}
      {showAddForm && (
        <section className="border-b border-border bg-card py-8">
          <div className="container">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Add New Property</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="Property title"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price</label>
                    <input
                      type="number"
                      placeholder="Price"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Property Type</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                      <option>House</option>
                      <option>Apartment</option>
                      <option>Condo</option>
                      <option>Townhouse</option>
                      <option>Land</option>
                      <option>Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bedrooms</label>
                    <input
                      type="number"
                      placeholder="Bedrooms"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <input
                      type="text"
                      placeholder="Street address"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      placeholder="City"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Property description"
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-accent hover:bg-accent/90">
                    Add Property
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </section>
      )}

      {/* Properties Table */}
      <section className="flex-1 py-12">
        <div className="container">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {allProperties?.map((property: any) => (
                <div key={property.id}>
                  {/* Property Row */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-card/50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{property.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {property.city}, {property.state} • ${Number(property.price).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/property/${property.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedPropertyId(
                            expandedPropertyId === property.id ? null : property.id
                          )
                        }
                        className="gap-2"
                      >
                        <Images className="w-4 h-4" />
                        {expandedPropertyId === property.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Image Management Section */}
                  {expandedPropertyId === property.id && (
                    <Card className="mt-4 p-6 border-accent/20">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-semibold mb-4">Manage Images</h4>

                          {uploadingPropertyId === property.id ? (
                            <ImageUpload
                              onUpload={handleImageUpload}
                              isLoading={uploadImages.isPending}
                              maxFiles={10}
                            />
                          ) : (
                            <Button
                              onClick={() => setUploadingPropertyId(property.id)}
                              className="w-full bg-accent hover:bg-accent/90 gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Upload Images
                            </Button>
                          )}
                        </div>

                        {/* Current Images */}
                        {Array.isArray(propertyImages) && propertyImages.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-3">Current Images ({propertyImages.length})</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {propertyImages.map((image: any) => (
                                <div
                                  key={image.id}
                                  className="relative group rounded-lg overflow-hidden border border-border"
                                >
                                  <div className="aspect-square bg-muted flex items-center justify-center">
                                    <img
                                      src={image.imageUrl}
                                      alt={image.caption || "Property image"}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() =>
                                      deleteImage.mutate({ imageId: image.id })
                                    }
                                    className="absolute top-2 right-2 p-2 rounded-lg bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>

                                  {/* Caption */}
                                  {image.caption && (
                                    <div className="p-2 bg-card/80 text-xs text-muted-foreground truncate">
                                      {image.caption}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(!Array.isArray(propertyImages) || propertyImages.length === 0) && uploadingPropertyId !== property.id && (
                          <p className="text-center text-muted-foreground py-8">
                            No images uploaded yet
                          </p>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
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
