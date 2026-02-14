"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [loginUrl, setLoginUrl] = useState("");

  useEffect(() => {
    setLoginUrl(getLoginUrl());
  }, []);

  const { data: savedSearchesRaw } = trpc.savedSearches.getAll.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  const { data: favoritesRaw } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: comparisonRaw } = trpc.comparisons.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Unwrap SuperJSON envelopes if present
  const savedSearches = useMemo(() => {
    if (!savedSearchesRaw) return [];
    if (
      typeof savedSearchesRaw === "object" &&
      "json" in savedSearchesRaw &&
      "meta" in savedSearchesRaw
    ) {
      const unwrapped = (savedSearchesRaw as any).json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(savedSearchesRaw) ? savedSearchesRaw : [];
  }, [savedSearchesRaw]);

  const favorites = useMemo(() => {
    if (!favoritesRaw) return [];
    if (
      typeof favoritesRaw === "object" &&
      "json" in favoritesRaw &&
      "meta" in favoritesRaw
    ) {
      const unwrapped = (favoritesRaw as any).json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(favoritesRaw) ? favoritesRaw : [];
  }, [favoritesRaw]);

  const comparison = useMemo(() => {
    if (!comparisonRaw) return [];
    if (
      typeof comparisonRaw === "object" &&
      "json" in comparisonRaw &&
      "meta" in comparisonRaw
    ) {
      const unwrapped = (comparisonRaw as any).json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(comparisonRaw) ? comparisonRaw : [];
  }, [comparisonRaw]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">
              Faça login para ver seu perfil
            </h1>
            <p className="text-muted-foreground max-w-md">
              Acesse suas pesquisas salvas, favoritos e detalhes da conta
              fazendo login.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-accent hover:bg-accent/90"
              disabled={!loginUrl}
            >
              <a href={loginUrl || "#"}>Entrar</a>
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
          <h1 className="text-4xl font-bold mb-2">Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie sua conta e itens salvos
          </p>
        </div>
      </section>

      <section className="flex-1 py-12">
        <div className="container grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Detalhes da Conta</h2>
              <p className="text-muted-foreground text-sm">
                Suas informações de perfil atuais
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">
                  {user?.name || "Não fornecido"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">
                  {user?.email || "Não fornecido"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone</span>
                <span className="font-medium">
                  {user?.telefone || "Não fornecido"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Função</span>
                <span className="font-medium capitalize">
                  {user?.role || "usuário"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último Acesso</span>
                <span className="font-medium">
                  {user?.lastSignedIn
                    ? new Date(user.lastSignedIn).toLocaleDateString()
                    : "Desconhecido"}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={() => logout()}>
              Sair
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Itens Salvos</h2>
              <p className="text-muted-foreground text-sm">
                Acesso rápido aos seus favoritos
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Favoritos</span>
                <span className="font-medium">{favorites.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pesquisas Salvas</span>
                <span className="font-medium">{savedSearches.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Lista de Comparação
                </span>
                <span className="font-medium">{comparison.length}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/favorites">Ver Favoritos</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/properties">Explorar Propriedades</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Dicas da Conta</h2>
              <p className="text-muted-foreground text-sm">
                Aproveite ao máximo sua conta
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Salve seus anúncios favoritos para acesso rápido.</li>
              <li>Use pesquisas salvas para acompanhar novos imóveis.</li>
              <li>Compare propriedades lado a lado antes de decidir.</li>
            </ul>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50 py-8 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 SaborRifaina. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
