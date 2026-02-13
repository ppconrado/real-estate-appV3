"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { MapPin, Search, TrendingUp, Award } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

function FeaturedPropertyImage({
  imageUrl,
  title,
}: {
  imageUrl?: string;
  title: string;
}) {
  if (!imageUrl) {
    return (
      <div className="w-full h-48 bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-accent/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Property Image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-48 bg-muted overflow-hidden relative">
      <Image src={imageUrl} alt={title} fill className="object-cover" />
    </div>
  );
}

export default function Home() {
  const { data: featuredPropertiesRaw, isLoading } =
    trpc.properties.getFeatured.useQuery();
  const featuredProperties = useMemo(() => {
    if (!featuredPropertiesRaw) return [];
    if (
      typeof featuredPropertiesRaw === "object" &&
      "json" in featuredPropertiesRaw &&
      "meta" in featuredPropertiesRaw
    ) {
      const unwrapped = (featuredPropertiesRaw as any).json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(featuredPropertiesRaw) ? featuredPropertiesRaw : [];
  }, [featuredPropertiesRaw]);
  const featuredList = Array.isArray(featuredProperties)
    ? featuredProperties
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-br from-background via-background to-card">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Encontre sua Propriedade{" "}
              <span className="text-accent">dos Sonhos</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubra propriedades excepcionais em locais privilegiados.
              Explore nossa coleção selecionada de imóveis residenciais e para
              seu lazer.
            </p>
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Explore por localização, tipo de propriedade..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <Button size="lg" className="bg-accent hover:bg-accent/90">
                Explore
              </Button>
            </div>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button
                size="lg"
                asChild
                className="bg-accent hover:bg-accent/90"
              >
                <Link href="/properties">Explore Todas as Propriedades</Link>
              </Button>
              <Button size="lg" variant="outline">
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-16 md:py-24 border-t border-border">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">
                Localizações Privilegiadas
              </h3>
              <p className="text-muted-foreground">
                Propriedades nos bairros e áreas mais desejáveis
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">Melhor Valor</h3>
              <p className="text-muted-foreground">
                Preços competitivos com análise de mercado transparente
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">Suporte Especializado</h3>
              <p className="text-muted-foreground">
                Orientação profissional ao longo de toda a sua jornada
                imobiliária
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Featured Properties Section */}
      <section className="py-16 md:py-24 bg-card/50 border-t border-border">
        <div className="container">
          <div className="space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-bold">Propriedades em Destaque</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Seleções cuidadosamente escolhidas da nossa coleção premium
              </p>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-80 bg-muted rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredList.map((property: any) => (
                  <Link key={property.id} href={`/properties/${property.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      {/* Property Image Placeholder */}
                      <FeaturedPropertyImage
                        imageUrl={property.images?.[0]?.imageUrl}
                        title={property.title}
                      />
                      {/* Property Info */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                          {property.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {property.city}, {property.state}
                        </p>
                        <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-t border-b border-border">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              Quartos
                            </p>
                            <p className="font-semibold">{property.bedrooms}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              Banheiros
                            </p>
                            <p className="font-semibold">
                              {property.bathrooms}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              metros²
                            </p>
                            <p className="font-semibold">
                              {property.squareFeet?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <p className="text-2xl font-bold text-accent mb-3">
                            R$ {Number(property.price).toLocaleString()}
                          </p>
                          <Button className="w-full bg-accent hover:bg-accent/90">
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            <div className="text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/properties">Explore Todas as Propriedades</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 md:py-24 border-t border-border">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6 bg-card rounded-lg p-8 md:p-12 border border-border">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para Encontrar Sua Propriedade dos Sonhos?
            </h2>
            <p className="text-muted-foreground text-lg">
              Comece sua jornada imobiliária hoje com nossas listas de
              propriedades abrangentes e orientação especializada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90"
                asChild
              >
                <Link href="/properties">Explore Propriedades</Link>
              </Button>
              <Button size="lg" variant="outline">
                Contacte um Agente
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 mt-auto">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Sobre</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Carreiras
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Propriedades</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    À Venda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Para Alugar
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Novas Listagens
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contato
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacidade
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Termos
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 SaborRifaina. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
