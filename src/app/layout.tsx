import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

// export const metadata: Metadata = {
//   title: "SaborRifaina - Imóveis e Tours",
//   description: "Listagens de imóveis modernos e tours",
// };

export const metadata = {
  title: "Sabor Rifaina - Imóveis e Turismo",
  description:
    "Descubra imóveis e experiências em Rifaina/SP com o Sabor Rifaina.",
  keywords: ["Rifaina", "imóveis", "turismo", "casas", "apartamentos"],
  authors: [{ name: "Sabor Rifaina" }],
  robots: "index, follow",
  metadataBase: new URL("https://saborrifaina.vercel.app"),
  openGraph: {
    title: "Sabor Rifaina - Imóveis e Turismo",
    description: "Descubra imóveis e experiências em Rifaina/SP.",
    url: "https://saborrifaina.vercel.app",
    siteName: "Sabor Rifaina",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sabor Rifaina",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sabor Rifaina - Imóveis e Turismo",
    description: "Descubra imóveis e experiências em Rifaina/SP.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta
          name="keywords"
          content="Rifaina, imóveis, turismo, casas, apartamentos"
        />
        <meta name="author" content="Sabor Rifaina" />
        <meta name="robots" content="index, follow" />
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Sabor Rifaina - Imóveis e Turismo" />
        <meta
          property="og:description"
          content="Descubra imóveis e experiências em Rifaina/SP."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="https://saborrifaina.vercel.app" />
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
