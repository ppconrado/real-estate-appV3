import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SaborRifaina - Imóveis e Tours",
  description: "Listagens de imóveis modernos e tours",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
