"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Menu, X, Scale } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export default function Header() {
  const { isAuthenticated, user, refresh } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerTelefone, setRegisterTelefone] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerPassword, setRegisterPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const registerPasswordRef = useRef<HTMLInputElement>(null);

  const googleLoginUrl = getLoginUrl();

  const openLoginDialog = () => {
    setLoginOpen(true);
    setRegisterOpen(false);
    setIsMenuOpen(false);
  };

  const openRegisterDialog = () => {
    setRegisterOpen(true);
    setLoginOpen(false);
    setIsMenuOpen(false);
  };

  const handleGoogleLogin = () => {
    if (!googleLoginUrl || typeof window === "undefined") return;
    window.location.href = googleLoginUrl;
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLoginError(payload.error || "Falha ao entrar. Tente novamente.");
        return;
      }
      await refresh();
      setLoginOpen(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (error) {
      console.error("[Login] Failed", error);
      setLoginError("Falha ao entrar. Tente novamente.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setRegisterError(null);
    setRegisterSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          telefone: registerTelefone,
          password: registerPassword,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setRegisterError(
          payload.error || "Falha ao registrar. Tente novamente."
        );
        if (registerPasswordRef.current) registerPasswordRef.current.value = "";
        return;
      }
      await refresh();
      setRegisterOpen(false);
      setRegisterName("");
      setRegisterEmail("");
      setRegisterTelefone("");
      setRegisterPassword("");
    } catch (error) {
      console.error("[Register] Failed", error);
      setRegisterError("Falha ao registrar. Tente novamente.");
    } finally {
      setRegisterSubmitting(false);
    }
  };

  useEffect(() => {
    console.log("[Header] Auth state:", { isAuthenticated, user });
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!loginOpen) setLoginError(null);
  }, [loginOpen]);

  useEffect(() => {
    if (!registerOpen) setRegisterError(null);
  }, [registerOpen]);

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
            <>
              <Button variant="outline" size="sm" onClick={openRegisterDialog}>
                Registrar
              </Button>
              <Button size="sm" onClick={openLoginDialog}>
                Entrar
              </Button>
            </>
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
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openRegisterDialog}
                >
                  Registrar
                </Button>
                <Button size="sm" onClick={openLoginDialog}>
                  Entrar
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar</DialogTitle>
            <DialogDescription>
              Entre com seu email ou continue com Google.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={handleGoogleLogin}
              disabled={!googleLoginUrl}
            >
              Continuar com Google
            </Button>
            <div className="text-center text-xs text-muted-foreground">Ou</div>
          </div>

          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={event => setLoginEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={event => setLoginPassword(event.target.value)}
              />
            </div>
            {loginError ? (
              <p className="text-sm text-destructive">{loginError}</p>
            ) : null}
            <Button className="w-full" type="submit" disabled={loginSubmitting}>
              {loginSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar</DialogTitle>
            <DialogDescription>
              Crie sua conta com nome completo, email e telefone.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleRegisterSubmit}>
            <div className="space-y-2">
              <Label htmlFor="register-name">Nome completo</Label>
              <Input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                value={registerName}
                onChange={event => setRegisterName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={registerEmail}
                onChange={event => setRegisterEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-telefone">Telefone</Label>
              <Input
                id="register-telefone"
                type="tel"
                autoComplete="tel"
                required
                value={registerTelefone}
                onChange={event => setRegisterTelefone(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Senha</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                value={registerPassword}
                ref={registerPasswordRef}
                onChange={event => setRegisterPassword(event.target.value)}
              />
            </div>
            {registerError ? (
              <p className="text-sm text-destructive">{registerError}</p>
            ) : null}
            <Button
              className="w-full"
              type="submit"
              disabled={registerSubmitting}
            >
              {registerSubmitting ? "Registrando..." : "Registrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
