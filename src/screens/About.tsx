import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import { Award, MapPin, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative overflow-hidden py-16 md:py-24 border-b border-border bg-card/50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm tracking-wide text-muted-foreground">
              Sobre SaborRifaina
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Construído para compradores e vendedores modernos
            </h1>
            <p className="text-lg text-muted-foreground">
              Combinamos expertise local confiável com insights baseados em
              dados para que você possa se mover mais rápido, se manter
              informado e se sentir confiante em cada etapa da sua jornada
              imobiliária.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/properties">Procurar Imóveis</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Fale com nossa equipe</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-xl font-semibold">Insights locais</h2>
              <p className="text-muted-foreground">
                Dados em nível de bairro e orientação de preços em tempo real
                para ajudá-lo a escolher a localização certa.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-xl font-semibold">Clareza de mercado</h2>
              <p className="text-muted-foreground">
                Comparações transparentes, sinais de demanda e análise de
                tendências para que você sempre conheça o valor real.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-xl font-semibold">Suporte humano</h2>
              <p className="text-muted-foreground">
                Uma equipe que permanece com você desde a primeira visita até o
                dia do fechamento.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 border-t border-border bg-card/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <p className="text-3xl font-bold">2,500+</p>
              <p className="text-sm text-muted-foreground">
                Imóveis monitorados
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">98%</p>
              <p className="text-sm text-muted-foreground">
                Satisfação do cliente
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">120</p>
              <p className="text-sm text-muted-foreground">Bairros Atendidos</p>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Serviço premiado</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold">
                Pronto para encontrar sua próxima casa?
              </h2>
              <p className="text-muted-foreground">
                Comece a explorar os imóveis ou fale com um consultor hoje
                mesmo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/properties">Procurar Imóveis</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Entrar em contato</Link>
              </Button>
            </div>
          </div>
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
