"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, Scale } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignIn = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (typeof window !== "undefined") {
      window.location.href = getLoginUrl();
    }
  };

  useEffect(() => {
    console.log("[Header] Auth state:", { isAuthenticated, user });
  }, [isAuthenticated, user]);

  const { data: comparisonPropertiesRaw } = trpc.comparisons.getAll.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Unwrap SuperJSON envelope if present
  const comparisonProperties = useMemo(() => {
    if (!comparisonPropertiesRaw) return [];
    const isSuperjsonEnvelope = (
      value: unknown
    ): value is { json: unknown; meta: unknown } =>
      typeof value === "object" &&
      value !== null &&
      "json" in value &&
      "meta" in value;

    if (isSuperjsonEnvelope(comparisonPropertiesRaw)) {
      const unwrapped = comparisonPropertiesRaw.json;
      return Array.isArray(unwrapped) ? unwrapped : [];
    }
    return Array.isArray(comparisonPropertiesRaw)
      ? comparisonPropertiesRaw
      : [];
  }, [comparisonPropertiesRaw]);

  const displayName = user?.name || user?.email || "Account";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-xl text-foreground hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent to-accent/80 flex items-center justify-center">
            <span className="text-white font-bold">SR</span>
          </div>
          <span className="hidden sm:inline">SaborRifaina</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/properties"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Propriedades
          </Link>
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sobre
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contato
          </Link>
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/favorites"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Favoritos
              </Link>
              {comparisonProperties.length > 0 && (
                <Link
                  href="/comparison"
                  className="relative text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Scale className="w-4 h-4" />
                  Compare
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {comparisonProperties.length}
                  </span>
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {displayName}
              </Link>
              <Button variant="outline" size="sm" asChild>
                <a href="/logout">Sair</a>
              </Button>
            </>
          ) : (
            <Button size="sm" asChild>
              <a href="#" onClick={handleSignIn}>
                Entrar
              </a>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <nav className="container py-4 flex flex-col gap-4">
            <Link
              href="/properties"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Imóveis
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sobre
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contato
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/favorites"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Favoritos
                </Link>
                {comparisonProperties.length > 0 && (
                  <Link
                    href="/comparison"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Scale className="w-4 h-4" />
                    Compare ({comparisonProperties.length})
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {displayName}
                </Link>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href="/logout">Sair</a>
                </Button>
              </>
            ) : (
              <Button size="sm" asChild className="w-full">
                <a href="#" onClick={handleSignIn}>
                  Entrar
                </a>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
