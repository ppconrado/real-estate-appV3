"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Bed,
  Bath,
  Ruler,
  Heart,
  Share2,
  Phone,
  Mail,
} from "lucide-react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ImageGallery from "@/components/ImageGallery";
import ViewingScheduler from "@/components/ViewingScheduler";
import { MapView } from "@/components/Map";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { unwrapSuperjson } from "@/lib/unwrapSuperjson";

export default function PropertyDetail() {
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [propertyFallback, setPropertyFallback] = useState<any | null>(null);
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const propertyId = rawId ? Number.parseInt(String(rawId), 10) : 0;
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    if (!user) return;
    setInquiryForm(prev => ({
      ...prev,
      name: user.name || prev.name,
      email: user.email || prev.email,
    }));
  }, [user]);

  // Fetch property images
  const { data: propertyImagesRaw } = trpc.images.getPropertyImages.useQuery(
    { propertyId },
    { enabled: propertyId > 0 }
  );

  const propertyImages = useMemo(() => {
    const unwrapped = unwrapSuperjson(propertyImagesRaw);
    return Array.isArray(unwrapped) ? unwrapped : [];
  }, [propertyImagesRaw]);

  const { data: propertyRaw, isLoading } = trpc.properties.getById.useQuery(
    { id: propertyId },
    { enabled: propertyId > 0 }
  );

  const property = useMemo(() => unwrapSuperjson(propertyRaw), [propertyRaw]);

  useEffect(() => {
    if (!propertyId || property) return;
    let isMounted = true;

    fetch(`/api/properties/${propertyId}`)
      .then(async response => {
        if (!response.ok) return null;
        return response.json();
      })
      .then(data => {
        if (!isMounted) return;
        setPropertyFallback(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setPropertyFallback(null);
      });

    return () => {
      isMounted = false;
    };
  }, [propertyId, property]);

  const submitInquiry = trpc.inquiries.submit.useMutation({
    onSuccess: () => {
      toast.success("Consulta enviada com sucesso!");
      setInquiryOpen(false);
      setInquiryForm({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        message: "",
      });
    },
    onError: error => {
      toast.error(error.message || "Falha ao enviar a consulta");
    },
  });

  const resolvedProperty = property ?? propertyFallback;

  const propertyCoordinates = useMemo(() => {
    if (!resolvedProperty?.latitude || !resolvedProperty?.longitude)
      return null;
    const lat = Number(resolvedProperty.latitude);
    const lng = Number(resolvedProperty.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [resolvedProperty]);

  const displayImages =
    propertyImages && propertyImages.length > 0
      ? propertyImages.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          caption: img.caption || undefined,
        }))
      : (propertyFallback?.images ?? []).map((img: any) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          caption: img.caption || undefined,
        }));

  console.log("[PropertyDetail] Property data:", {
    propertyId,
    property: resolvedProperty,
    propertyImages,
    displayImages,
    propertyCoordinates,
  });

  if (!propertyId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Invalid property ID.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Image Gallery */}
      <section className="w-full bg-card border-b border-border">
        <div className="container py-6">
          {isLoading ? (
            <div className="w-full aspect-video bg-muted rounded-lg animate-pulse" />
          ) : resolvedProperty ? (
            <ImageGallery
              images={displayImages}
              title={resolvedProperty.title}
            />
          ) : (
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Propriedade não encontrada
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-12">
        <div className="container">
          {isLoading ? (
            <div className="space-y-6">
              <div className="h-10 w-1/2 bg-muted rounded-lg animate-pulse" />
              <div className="h-6 w-1/3 bg-muted rounded-lg animate-pulse" />
              <div className="h-64 bg-muted rounded-lg animate-pulse" />
            </div>
          ) : !resolvedProperty ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Propriedade não encontrada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Property Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header Info */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-4xl font-bold mb-2">
                        {resolvedProperty.title}
                      </h1>
                      <p className="text-lg text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {resolvedProperty.address}, {resolvedProperty.city},{" "}
                        {resolvedProperty.state} {resolvedProperty.zipCode}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsFavorited(!isFavorited)}
                        className={isFavorited ? "text-accent" : ""}
                      >
                        <Heart
                          className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`}
                        />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-4xl font-bold text-accent mb-4">
                    {formatPrice(resolvedProperty.price)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Bed className="w-5 h-5 text-accent" />
                        <span className="text-2xl font-bold">
                          {resolvedProperty.bedrooms}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Quartos</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Bath className="w-5 h-5 text-accent" />
                        <span className="text-2xl font-bold">
                          {resolvedProperty.bathrooms}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Banheiros</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Ruler className="w-5 h-5 text-accent" />
                        <span className="text-2xl font-bold">
                          {resolvedProperty.squareFeet
                            ? `${resolvedProperty.squareFeet} metros²`
                            : "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        metros quadrados
                      </p>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl font-bold capitalize">
                          {resolvedProperty.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Status</p>
                    </Card>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    Sobre Esta Propriedade
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {resolvedProperty.description ||
                      "Nenhuma descrição fornecida."}
                  </p>
                </div>

                {/* Amenities */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Comodidades</h2>
                  {Array.isArray(resolvedProperty.amenities) &&
                  resolvedProperty.amenities.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {resolvedProperty.amenities.map(
                        (amenity: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border"
                          >
                            <div className="w-2 h-2 rounded-full bg-accent" />
                            <span className="text-sm">{amenity}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Nenhuma comodidade listada.
                    </p>
                  )}
                </div>

                {/* Map */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Localização</h2>
                  {propertyCoordinates ? (
                    <div className="w-full h-96 rounded-lg overflow-hidden border border-border">
                      <MapView
                        initialCenter={propertyCoordinates}
                        initialZoom={15}
                        marker={{
                          position: propertyCoordinates,
                          title: resolvedProperty.title,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-96 bg-linear-to-br from-accent/20 to-accent/5 rounded-lg flex items-center justify-center border border-border">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-accent/50 mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          Localização indisponível
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Contact & CTA */}
              <div className="space-y-6">
                {/* Contact Card */}
                <Card className="p-6 space-y-4 sticky top-20">
                  <h3 className="text-xl font-bold">
                    Interessado nesta propriedade?
                  </h3>

                  <ViewingScheduler
                    propertyId={propertyId}
                    propertyTitle={resolvedProperty.title}
                  />
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => setInquiryOpen(true)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Consulta
                  </Button>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold mb-3">
                      Informações do Corretor
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Daniel Polo
                        </span>
                        <br />
                        Corretor de Imóveis - CRECISP 274989
                      </p>
                      <p className="text-muted-foreground">
                        <Phone className="w-4 h-4 inline mr-2" />
                        +55 (16) 99963-7161
                      </p>
                      <p className="text-muted-foreground">
                        <Mail className="w-4 h-4 inline mr-2" />
                        danipolo.uk@gmail.com
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Property Stats */}
                <Card className="p-6 space-y-4">
                  <h3 className="font-bold">Detalhes da Propriedade</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tipo de Propriedade
                      </span>
                      <span className="font-medium capitalize">
                        {resolvedProperty.propertyType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Ano de Construção
                      </span>
                      <span className="font-medium">
                        {resolvedProperty.yearBuilt}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tamanho do Lote
                      </span>
                      <span className="font-medium">
                        {resolvedProperty.lotSize} hectares
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Taxas de HOA
                      </span>
                      <span className="font-medium">
                        {resolvedProperty.hoaFees}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>

      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Enviar Consulta de Propriedade</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (
                !inquiryForm.name ||
                !inquiryForm.email ||
                !inquiryForm.message
              ) {
                toast.error("Por favor, preencha todos os campos obrigatórios");
                return;
              }
              submitInquiry.mutate({
                propertyId,
                name: inquiryForm.name,
                email: inquiryForm.email,
                phone: inquiryForm.phone || undefined,
                message: inquiryForm.message,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="inquiry-name">Name *</Label>
              <Input
                id="inquiry-name"
                value={inquiryForm.name}
                onChange={e =>
                  setInquiryForm(prev => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inquiry-email">Email *</Label>
              <Input
                id="inquiry-email"
                type="email"
                value={inquiryForm.email}
                onChange={e =>
                  setInquiryForm(prev => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inquiry-phone">Telefone</Label>
              <Input
                id="inquiry-phone"
                value={inquiryForm.phone}
                onChange={e =>
                  setInquiryForm(prev => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inquiry-message">Mensagem *</Label>
              <Textarea
                id="inquiry-message"
                value={inquiryForm.message}
                onChange={e =>
                  setInquiryForm(prev => ({ ...prev, message: e.target.value }))
                }
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInquiryOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitInquiry.isPending}>
                {submitInquiry.isPending ? "Enviando..." : "Enviar Consulta"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 SaborRifaina. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
