import type { Metadata } from "next";
import SupplierProfileClient from "@/app/components/SupplierProfileClient";

export const metadata: Metadata = {
  title: "Supplier Profile | MarketPlaceX",
  description: "View supplier profile, contact information, location map, and active material listings.",
};

type SupplierPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SupplierPage({ params }: SupplierPageProps) {
  const { id } = await params;
  return <SupplierProfileClient supplierId={id} />;
}
