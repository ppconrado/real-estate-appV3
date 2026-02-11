"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { MapPin, Heart } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect, useState, useMemo } from "react";

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const [loginUrl, setLoginUrl] = useState("");

  useEffect(() => {
    setLoginUrl(getLoginUrl());
  }, []);
  const { data: favoritesListRaw, isLoading } = trpc.favorites.list.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  // Unwrap SuperJSON envelope if present
  const favoritesList = useMemo(() => {
    if (!favoritesListRaw) return [];
    if (
      typeof favoritesListRaw === "object" &&
      "json" in favoritesListRaw &&
      "meta" in favoritesListRaw
    ) {
      const unwrapped = (favoritesListRaw as any).json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(favoritesListRaw) ? favoritesListRaw : [];
  }, [favoritesListRaw]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <Heart className="w-16 h-16 text-accent/50 mx-auto" />
            <h1 className="text-3xl font-bold">Sign In to View Favorites</h1>
            <p className="text-muted-foreground max-w-md">
              Create an account or sign in to save your favorite properties and
              access them anytime.
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90"
              asChild
              disabled={!loginUrl}
            >
              <a href={loginUrl || "#"}>Sign In</a>
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
          <h1 className="text-4xl font-bold mb-2">My Favorites</h1>
          <p className="text-muted-foreground">Properties you have saved</p>
        </div>
      </section>

      {/* Favorites Content */}
      <section className="flex-1 py-12">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-96 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : favoritesList && favoritesList.length > 0 ? (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                You have{" "}
                <span className="font-semibold text-foreground">
                  {favoritesList.length}
                </span>{" "}
                saved properties
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritesList.map((favorite: any) => (
                  <Link
                    key={favorite.id}
                    href={`/properties/${favorite.propertyId}`}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col group">
                      {/* Property Image Placeholder */}
                      <div className="w-full h-48 bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:from-accent/30 group-hover:to-accent/10 transition-colors">
                        <div className="text-center">
                          <MapPin className="w-8 h-8 text-accent/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Property Image
                          </p>
                        </div>
                      </div>

                      {/* Property Info */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                          Property #{favorite.propertyId}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Saved on{" "}
                          {new Date(favorite.createdAt).toLocaleDateString()}
                        </p>

                        <div className="mt-auto">
                          <Button className="w-full bg-accent hover:bg-accent/90">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-accent/20 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Favorites Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start exploring properties and save your favorites to view them
                later.
              </p>
              <Button
                size="lg"
                asChild
                className="bg-accent hover:bg-accent/90"
              >
                <Link href="/properties">Browse Properties</Link>
              </Button>
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
