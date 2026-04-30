import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TopBar } from "@/components/layout/top-bar";
import { HideOnHome } from "@/components/layout/hide-on-home";
import { themeInitScript } from "@/components/layout/theme-toggle";
import { STORE } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${STORE.name} — ${STORE.tagline}`,
    template: `%s | ${STORE.name}`,
  },
  description:
    "Vente de smartphones, tablettes, accessoires et produits reconditionnés. Service de réparation avec devis gratuit et suivi en ligne.",
  keywords: [
    "smartphones",
    "réparation iPhone",
    "réparation Samsung",
    "tablettes",
    "reconditionné",
    "occasion",
    "Bruxelles",
    "Uccle",
  ],
  applicationName: STORE.name,
  authors: [{ name: STORE.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_BE",
    url: SITE_URL,
    siteName: STORE.name,
    title: `${STORE.name} — ${STORE.tagline}`,
    description:
      "Vente de smartphones, tablettes, accessoires et produits reconditionnés. Service de réparation avec devis gratuit et suivi en ligne.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${STORE.name} — ${STORE.tagline}`,
    description:
      "Vente de smartphones, tablettes, accessoires et produits reconditionnés. Service de réparation avec devis gratuit et suivi en ligne.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground print:bg-white print:text-black">
        <div className="print:hidden">
          <TopBar />
          <Header />
        </div>
        <main className="flex-1">{children}</main>
        <div className="print:hidden">
          <Footer />
        </div>
      </body>
    </html>
  );
}
