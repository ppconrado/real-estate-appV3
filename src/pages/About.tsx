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
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              About RealEstate
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Built for modern buyers and sellers
            </h1>
            <p className="text-lg text-muted-foreground">
              We pair trusted local expertise with data-driven insights so you
              can move faster, stay informed, and feel confident in every step
              of your real estate journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/properties">Browse Properties</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Talk to our team</Link>
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
              <h2 className="text-xl font-semibold">Local insight</h2>
              <p className="text-muted-foreground">
                Neighborhood-level data and real-time pricing guidance to help
                you pick the right location.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-xl font-semibold">Market clarity</h2>
              <p className="text-muted-foreground">
                Transparent comps, demand signals, and trend analysis so you
                always know the real value.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-xl font-semibold">Human support</h2>
              <p className="text-muted-foreground">
                A team that stays with you from the first tour to closing day.
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
              <p className="text-sm text-muted-foreground">Listings tracked</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">98%</p>
              <p className="text-sm text-muted-foreground">
                Client satisfaction
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">120</p>
              <p className="text-sm text-muted-foreground">
                Neighborhood reports
              </p>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">
                Award-winning service
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold">
                Ready to find your next home?
              </h2>
              <p className="text-muted-foreground">
                Start exploring listings or talk with an advisor today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/properties">Explore listings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Get in touch</Link>
              </Button>
            </div>
          </div>
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
