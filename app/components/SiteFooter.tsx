import Link from "next/link";
import BrandLogo from "./BrandLogo";

const footerLinks = [
  { href: "/materials", label: "Marketplace" },
  { href: "/login?redirect=/supplier-dashboard", label: "Post Material" },
  { href: "/supplier-dashboard", label: "Supplier Dashboard" },
  { href: "/suppliers", label: "Nearby Suppliers" },
  { href: "/contact", label: "Contact" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#061b33] text-white">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-8">
        <div className="min-w-0">
          <BrandLogo inverse />
          <p className="mt-4 max-w-xl leading-7 text-slate-300">
            MarketPlaceX connects project buyers with construction material
            suppliers for aggregates, sand, bricks, cement, steel, electrical,
            plumbing, hardware, and wood products.
          </p>
        </div>

        <div className="grid grid-cols-1 content-start gap-2 sm:grid-cols-2">
          {footerLinks.map((link) => (
            <Link
              className="flex-shrink-0 rounded-md px-2 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
