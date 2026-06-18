import type { Metadata } from "next";
import SupplierDashboardClient from "../components/SupplierDashboardClient";

export const metadata: Metadata = {
  title: "Supplier Dashboard | MarketPlaceX",
  description:
    "Manage supplier profile, material listings, image uploads, and marketplace analytics.",
};

export default function SupplierDashboardPage() {
  return <SupplierDashboardClient />;
}
