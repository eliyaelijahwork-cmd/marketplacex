import type { Metadata } from "next";
import MaterialDetailsClient from "@/app/components/MaterialDetailsClient";

export const metadata: Metadata = {
  title: "Material Details | MarketPlaceX",
  description: "View construction material details, supplier profile, map, and contact actions.",
};

type MaterialDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MaterialDetailsPage({ params }: MaterialDetailsPageProps) {
  const { id } = await params;
  return <MaterialDetailsClient materialId={id} />;
}
