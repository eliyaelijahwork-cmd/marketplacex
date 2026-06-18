import type { Metadata } from "next";
import SupplierDirectoryClient from "../components/SupplierDirectoryClient";

export const metadata: Metadata = {
  title: "Nearby Suppliers | MarketPlaceX",
  description:
    "Find nearby construction material suppliers, compare specialties, and contact them directly.",
};

export default function SuppliersPage() {
  return <SupplierDirectoryClient />;
}
