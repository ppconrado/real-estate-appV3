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
            <h1 className="text-3xl font-bold">Sign In to View Your Profile</h1>
            <p className="text-muted-foreground max-w-md">
              Access your saved searches, favorites, and account details by
              signing in.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-accent hover:bg-accent/90"
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
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and saved items
          </p>
        </div>
      </section>

      <section className="flex-1 py-12">
        <div className="container grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Account Details</h2>
              <p className="text-muted-foreground text-sm">
                Your current profile information
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">
                  {user?.name || "Not provided"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">
                  {user?.email || "Not provided"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">
                  {user?.role || "user"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Sign In</span>
                <span className="font-medium">
                  {user?.lastSignedIn
                    ? new Date(user.lastSignedIn).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={() => logout()}>
              Sign Out
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Saved Items</h2>
              <p className="text-muted-foreground text-sm">
                Quick access to your favorites
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Favorites</span>
                <span className="font-medium">{favorites.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saved Searches</span>
                <span className="font-medium">{savedSearches.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comparison List</span>
                <span className="font-medium">{comparison.length}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/favorites">View Favorites</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/properties">Browse Properties</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Account Tips</h2>
              <p className="text-muted-foreground text-sm">
                Get the most out of your account
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Save your favorite listings for quick access.</li>
              <li>Use saved searches to track new inventory.</li>
              <li>Compare properties side-by-side before deciding.</li>
            </ul>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50 py-8 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 RealEstate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
