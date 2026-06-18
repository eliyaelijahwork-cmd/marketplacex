"use client";

import { useEffect, useMemo, useState } from "react";
import { filterMaterials, type MaterialFilters, type MaterialListing } from "@/app/data/marketplace";
import { useLocation } from "@/app/contexts/LocationContext";
import { listenToMaterials } from "@/app/lib/firebase/marketplace";

const defaultFilters: MaterialFilters = {
  query: "",
  category: "all",
  maxDistanceKm: 500,
  minPrice: "",
  maxPrice: "",
  location: "",
  minRating: "",
};

export function useMaterials(initialFilters?: Partial<MaterialFilters>) {
  const { location } = useLocation();
  const [materials, setMaterials] = useState<MaterialListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<MaterialFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  useEffect(() => {
    return listenToMaterials(
      (nextMaterials) => {
        setMaterials(nextMaterials);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
  }, []);

  const visibleMaterials = useMemo(
    () => filterMaterials(materials, filters, location),
    [filters, location, materials],
  );

  return {
    materials,
    visibleMaterials,
    filters,
    setFilters,
    loading,
    error,
  };
}
