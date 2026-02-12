"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Images,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: allPropertiesRaw, isLoading } =
    trpc.properties.getAll.useQuery();

  // Unwrap SuperJSON envelope if present
  const allProperties = useMemo(() => {
    if (!allPropertiesRaw) return [];
    // Check if data is wrapped in SuperJSON format
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

  const utils = trpc.useUtils();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedPropertyId, setExpandedPropertyId] = useState<number | null>(
    null
  );
  const [uploadingPropertyId, setUploadingPropertyId] = useState<number | null>(
    null
  );
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(
    null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    propertyType: "house",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    latitude: "",
    longitude: "",
    description: "",
    amenities: "",
    featured: false,
    status: "available",
  });

  const { data: propertyImagesRaw } = trpc.images.getPropertyImages.useQuery(
    { propertyId: expandedPropertyId || 0 },
    { enabled: expandedPropertyId !== null }
  );

  // Unwrap SuperJSON envelope for images
  const propertyImages = useMemo(() => {
    if (!propertyImagesRaw) return [];
    if (
      typeof propertyImagesRaw === "object" &&
      "json" in propertyImagesRaw &&
      "meta" in propertyImagesRaw
    ) {
      const unwrapped = (propertyImagesRaw as any).json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(propertyImagesRaw) ? propertyImagesRaw : [];
  }, [propertyImagesRaw]);

  const uploadImages = trpc.images.upload.useMutation({
    onSuccess: () => {
      utils.images.getPropertyImages.invalidate();
      toast.success("Imagens carregadas com sucesso");
      setUploadingPropertyId(null);
    },
    onError: error => {
      toast.error(error.message || "Falha no carregamento de imagens");
    },
  });

  const deleteImage = trpc.images.delete.useMutation({
    onSuccess: () => {
      utils.images.getPropertyImages.invalidate();
      toast.success("Imagem deletada com sucesso");
    },
  });

  const handleImageUpload = async (
    files: Array<{ file: File; caption?: string }>
  ) => {
    if (!uploadingPropertyId) return;

    for (const { file, caption } of files) {
      const reader = new FileReader();
      reader.onload = async e => {
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

  const createPropertyMutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      utils.properties.getAll.invalidate();
      toast.success("Property created");
      resetForm();
    },
    onError: error => {
      toast.error(error.message || "Criação da propriedade falhou");
    },
  });

  const updatePropertyMutation = trpc.properties.update.useMutation({
    onSuccess: () => {
      utils.properties.getAll.invalidate();
      toast.success("Property updated");
      resetForm();
    },
    onError: error => {
      toast.error(error.message || "Atualização da propriedade falhou");
    },
  });

  const deletePropertyMutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      utils.properties.getAll.invalidate();
      toast.success("Property deleted");
    },
    onError: error => {
      toast.error(error.message || "Falha ao deletar a propriedade");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      price: "",
      propertyType: "house",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      latitude: "",
      longitude: "",
      description: "",
      amenities: "",
      featured: false,
      status: "available",
    });
    setEditingPropertyId(null);
    setShowAddForm(false);
  };

  const startEdit = (property: any) => {
    setEditingPropertyId(property.id);
    setFormData({
      title: property.title || "",
      price: property.price ? String(property.price) : "",
      propertyType: property.propertyType || "house",
      bedrooms: property.bedrooms ? String(property.bedrooms) : "",
      bathrooms: property.bathrooms ? String(property.bathrooms) : "",
      squareFeet: property.squareFeet ? String(property.squareFeet) : "",
      address: property.address || "",
      city: property.city || "",
      state: property.state || "",
      zipCode: property.zipCode || "",
      latitude: property.latitude ? String(property.latitude) : "",
      longitude: property.longitude ? String(property.longitude) : "",
      description: property.description || "",
      amenities: Array.isArray(property.amenities)
        ? property.amenities.join(", ")
        : "",
      featured: Boolean(property.featured),
      status: property.status || "available",
    });
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const price = Number(formData.price);
    const bedrooms = Number(formData.bedrooms);
    const bathrooms = Number(formData.bathrooms);
    const squareFeet = Number(formData.squareFeet);
    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    if (
      [price, bedrooms, bathrooms, squareFeet, latitude, longitude].some(
        value => Number.isNaN(value)
      )
    ) {
      toast.error("Please fill in all numeric fields correctly");
      return;
    }

    const amenities = formData.amenities
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      price,
      propertyType: formData.propertyType as any,
      bedrooms,
      bathrooms,
      squareFeet,
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),
      latitude,
      longitude,
      description: formData.description.trim() || undefined,
      amenities,
      featured: formData.featured,
      status: formData.status as any,
    };

    if (editingPropertyId) {
      updatePropertyMutation.mutate({ id: editingPropertyId, ...payload });
      return;
    }

    createPropertyMutation.mutate(payload);
  };

  const geocodeAddress = async () => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as
      | string
      | undefined;
    if (!token) {
      toast.error("Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env");
      return;
    }

    const addressParts = [
      formData.address,
      formData.city,
      formData.state,
      formData.zipCode,
      "Brazil",
    ]
      .map(part => part.trim())
      .filter(Boolean);

    if (addressParts.length < 2) {
      toast.error("Enter at least address and city before geocoding");
      return;
    }

    const query = encodeURIComponent(addressParts.join(", "));
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1&language=pt&country=br`;

    try {
      setIsGeocoding(true);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Mapbox geocoding failed (${response.status})`);
      }

      const data = await response.json();
      const feature = data?.features?.[0];
      if (!feature || !Array.isArray(feature.center)) {
        toast.error("Nenhum resultado de geocodificação encontrado");
        return;
      }

      const [lng, lat] = feature.center;
      setFormData(prev => ({
        ...prev,
        latitude: Number(lat).toFixed(6),
        longitude: Number(lng).toFixed(6),
      }));
      toast.success("Latitude/longitude atualizadas a partir do endereço");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao geocodificar o endereço"
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o painel de administração.
            </p>
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90">
              <Link href="/">Voltar para a página inicial</Link>
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold">Painel de Administração</h1>
              <p className="text-muted-foreground">
                Gerencie suas listagens de propriedades e imagens
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" variant="outline" asChild>
                <Link href="/admin/inquiries">Consultas</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/admin/viewings">Visitas</Link>
              </Button>
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 gap-2"
                onClick={() => {
                  if (showAddForm) {
                    resetForm();
                    return;
                  }
                  setShowAddForm(true);
                }}
              >
                <Plus className="w-5 h-5" />
                {showAddForm ? "Fechar Formulário" : "Adicionar Propriedade"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Add Property Form */}
      {showAddForm && (
        <section className="border-b border-border bg-card py-8">
          <div className="container">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">
                {editingPropertyId
                  ? "Editar Propriedade"
                  : "Adicionar Nova Propriedade"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      placeholder="Título da propriedade"
                      value={formData.title}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Preço
                    </label>
                    <input
                      type="number"
                      placeholder="Preço"
                      value={formData.price}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tipo de Propriedade
                    </label>
                    <select
                      value={formData.propertyType}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          propertyType: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="house">Casa</option>
                      <option value="apartment">Apartamento</option>
                      <option value="condo">Condomínio</option>
                      <option value="townhouse">Casa Geminada</option>
                      <option value="land">Terreno</option>
                      <option value="commercial">Comercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="available">Disponível</option>
                      <option value="pending">Pendente</option>
                      <option value="sold">Vendido</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Quartos
                    </label>
                    <input
                      type="number"
                      placeholder="Quartos"
                      value={formData.bedrooms}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          bedrooms: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Banheiros
                    </label>
                    <input
                      type="number"
                      placeholder="Banheiros"
                      value={formData.bathrooms}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          bathrooms: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Metros Quadrados
                    </label>
                    <input
                      type="number"
                      placeholder="Metros Quadrados"
                      value={formData.squareFeet}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          squareFeet: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Endereço
                    </label>
                    <input
                      type="text"
                      placeholder="Endereço"
                      value={formData.address}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, city: e.target.value }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Estado
                    </label>
                    <input
                      type="text"
                      placeholder="Estado"
                      value={formData.state}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      placeholder="CEP"
                      value={formData.zipCode}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          zipCode: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Latitude"
                      value={formData.latitude}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          latitude: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Longitude"
                      value={formData.longitude}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          longitude: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={geocodeAddress}
                    disabled={isGeocoding}
                  >
                    {isGeocoding ? "Geocoding..." : "Auto-fill from address"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Utilize o Mapbox para encontrar coordenadas a partir dos
                    campos de endereço.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Comodidades (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="Piscina, Academia, Estacionamento"
                    value={formData.amenities}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        amenities: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={formData.featured}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        featured: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="featured" className="text-sm font-medium">
                    Destaque
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Descrição da propriedade"
                    rows={4}
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    className="bg-accent hover:bg-accent/90"
                    disabled={
                      createPropertyMutation.isPending ||
                      updatePropertyMutation.isPending
                    }
                  >
                    {editingPropertyId
                      ? updatePropertyMutation.isPending
                        ? "Salvando..."
                        : "Atualizar Propriedade"
                      : createPropertyMutation.isPending
                        ? "Criando..."
                        : "Adicionar Propriedade"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
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
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-20 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {allProperties?.map((property: any) => (
                <div key={property.id}>
                  {/* Property Row */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-card/50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {property.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {property.city}, {property.state} • $
                        {Number(property.price).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/properties/${property.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(property)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (
                            confirm(
                              "Deseja realmente excluir esta propriedade? Esta ação não pode ser desfeita."
                            )
                          ) {
                            deletePropertyMutation.mutate({ id: property.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedPropertyId(
                            expandedPropertyId === property.id
                              ? null
                              : property.id
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
                          <h4 className="text-lg font-semibold mb-4">
                            Gerenciar Imagens
                          </h4>

                          {uploadingPropertyId === property.id ? (
                            <ImageUpload
                              onUpload={handleImageUpload}
                              isLoading={uploadImages.isPending}
                              maxFiles={10}
                            />
                          ) : (
                            <Button
                              onClick={() =>
                                setUploadingPropertyId(property.id)
                              }
                              className="w-full bg-accent hover:bg-accent/90 gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Carregue as imagens para esta propriedade
                            </Button>
                          )}
                        </div>

                        {/* Current Images */}
                        {Array.isArray(propertyImages) &&
                          propertyImages.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-3">
                                Imagens Atuais ({propertyImages.length})
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {propertyImages.map((image: any) => (
                                  <div
                                    key={image.id}
                                    className="relative group rounded-lg overflow-hidden border border-border"
                                  >
                                    <div className="aspect-square bg-muted flex items-center justify-center">
                                      <image
                                        src={image.imageUrl}
                                        alt={
                                          image.caption ||
                                          "Imagem da propriedade"
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() =>
                                        deleteImage.mutate({
                                          imageId: image.id,
                                        })
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

                        {(!Array.isArray(propertyImages) ||
                          propertyImages.length === 0) &&
                          uploadingPropertyId !== property.id && (
                            <p className="text-center text-muted-foreground py-8">
                              Nenhuma imagem carregada ainda
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
          <p>&copy; 2026 SaborRifaina. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
