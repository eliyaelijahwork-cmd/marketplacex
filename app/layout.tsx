import type { Metadata } from "next";
import AppProviders from "./components/AppProviders";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketPlaceX | Construction Materials Marketplace",
  description:
    "Browse, compare, purchase, and post construction materials from verified suppliers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-950">
        <AppProviders>
          <SiteHeader />
          <div className="min-h-screen">{children}</div>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
