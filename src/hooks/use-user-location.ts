"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserLocation } from "@/lib/types";
import { findNearestArea, resolveManualLocation } from "@/lib/geo/areas";

const SESSION_KEY = "kania_craves_session_location";

type LocationState = {
  location: UserLocation | null;
  status: "idle" | "prompting" | "granted" | "denied" | "manual" | "error";
  error: string | null;
};

function readSession(): UserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserLocation) : null;
  } catch {
    return null;
  }
}

function writeSession(loc: UserLocation | null) {
  if (typeof window === "undefined") return;
  if (!loc) {
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(loc));
}

export function useUserLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    status: "idle",
    error: null,
  });

  useEffect(() => {
    const existing = readSession();
    if (existing) {
      setState({
        location: existing,
        status: existing.source === "manual" ? "manual" : "granted",
        error: null,
      });
    }
  }, []);

  const setLocation = useCallback((loc: UserLocation) => {
    writeSession(loc);
    setState({
      location: loc,
      status: loc.source === "manual" ? "manual" : "granted",
      error: null,
    });
  }, []);

  const requestGps = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({
        ...s,
        status: "error",
        error: "Geolocation is not supported on this device.",
      }));
      return;
    }
    setState((s) => ({ ...s, status: "prompting", error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const area = findNearestArea(coords);
        const loc: UserLocation = {
          ...coords,
          area: area.name,
          city: area.city,
          timestamp: Date.now(),
          source: "gps",
        };
        writeSession(loc);
        setState({ location: loc, status: "granted", error: null });
      },
      (err) => {
        setState({
          location: null,
          status: "denied",
          error:
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied. Search an area manually."
              : "Could not get your location. Try manual search.",
        });
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 },
    );
  }, []);

  const setManual = useCallback(
    (query: string) => {
      const area = resolveManualLocation(query);
      if (!area) {
        setState((s) => ({
          ...s,
          error: "Area not found. Try Senopati, SCBD, Blok M, PIK…",
        }));
        return false;
      }
      const loc: UserLocation = {
        lat: area.lat,
        lng: area.lng,
        area: area.name,
        city: area.city,
        timestamp: Date.now(),
        source: "manual",
      };
      setLocation(loc);
      return true;
    },
    [setLocation],
  );

  const clear = useCallback(() => {
    writeSession(null);
    setState({ location: null, status: "idle", error: null });
  }, []);

  return {
    ...state,
    requestGps,
    setManual,
    setLocation,
    clear,
  };
}
