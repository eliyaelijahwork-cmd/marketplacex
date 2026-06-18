"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { LocationProvider } from "@/app/contexts/LocationContext";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LocationProvider>{children}</LocationProvider>
    </AuthProvider>
  );
}
