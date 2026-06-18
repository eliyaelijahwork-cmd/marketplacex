"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Coordinates } from "@/app/data/marketplace";

export type UserLocation = Coordinates & {
  city: string;
  state: string;
  address: string;
};

type LocationContextValue = {
  location: UserLocation | null;
  loading: boolean;
  error: string;
  permissionState: PermissionState | "unsupported" | "unknown";
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
};

const storageKey = "marketplacex-user-location";

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const savedLocation = window.localStorage.getItem(storageKey);
      return savedLocation ? (JSON.parse(savedLocation) as UserLocation) : null;
    } catch {
      window.localStorage.removeItem(storageKey);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [permissionState, setPermissionState] = useState<LocationContextValue["permissionState"]>(
    () =>
      typeof navigator !== "undefined" && !("geolocation" in navigator)
        ? "unsupported"
        : "unknown",
  );

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          setPermissionState(status.state);
          status.onchange = () => setPermissionState(status.state);
        })
        .catch(() => setPermissionState("unknown"));
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setError("");

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      setPermissionState("unsupported");
      return;
    }

    setLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 5 * 60 * 1000,
          timeout: 15000,
        });
      });

      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const resolvedAddress = await reverseGeocode(coordinates);
      const nextLocation = {
        ...coordinates,
        ...resolvedAddress,
      };

      setLocation(nextLocation);
      window.localStorage.setItem(storageKey, JSON.stringify(nextLocation));
      setPermissionState("granted");
    } catch (reason) {
      const locationError = isGeolocationError(reason) ? reason : null;
      const message = locationError
        ? geolocationMessage(locationError)
        : "Could not detect your location right now.";
      setError(message);
      if (locationError && locationError.code === locationError.PERMISSION_DENIED) {
        setPermissionState("denied");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError("");
    window.localStorage.removeItem(storageKey);
  }, []);

  const value = useMemo(
    () => ({
      location,
      loading,
      error,
      permissionState,
      requestLocation,
      clearLocation,
    }),
    [clearLocation, error, loading, location, permissionState, requestLocation],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const value = useContext(LocationContext);
  if (!value) {
    throw new Error("useLocation must be used inside LocationProvider.");
  }
  return value;
}

async function reverseGeocode({ latitude, longitude }: Coordinates) {
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(latitude),
      lon: String(longitude),
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);

    if (!response.ok) {
      throw new Error("Reverse geocoding failed.");
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        state?: string;
      };
    };

    return {
      city:
        data.address?.city ??
        data.address?.town ??
        data.address?.village ??
        data.address?.suburb ??
        "Current area",
      state: data.address?.state ?? "",
      address: data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  } catch {
    return {
      city: "Current area",
      state: "",
      address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  }
}

function geolocationMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Location information is unavailable.";
  }
  if (error.code === error.TIMEOUT) {
    return "Location request timed out.";
  }
  return "Could not detect your location right now.";
}

function isGeolocationError(value: unknown): value is GeolocationPositionError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value
  );
}
