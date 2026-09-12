"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import type { RecommendationResult, UserLocation } from "@/lib/types";
import { googleMapsDirectionsUrl } from "@/lib/maps/google";
import { formatDistance } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const STATUS_COLOR: Record<string, string> = {
  wishlist: "#f59e0b",
  favorite: "#e11d48",
  visited: "#059669",
  discover: "#6366f1",
  not_recommended: "#78716c",
  want_to_try_again: "#0284c7",
};

function pinIcon(status: string) {
  const color = STATUS_COLOR[status] ?? "#c2410c";
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25)"></span>`,
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function FoodMap({
  center,
  userLocation,
  pins,
}: {
  center: { lat: number; lng: number };
  userLocation: UserLocation | null;
  pins: RecommendationResult[];
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      className="h-[60vh] w-full rounded-2xl shadow-[var(--shadow-card)]"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lng={center.lng} />
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{
            color: "#c2410c",
            fillColor: "#c2410c",
            fillOpacity: 0.9,
          }}
        >
          <Popup>You are here · {userLocation.area}</Popup>
        </CircleMarker>
      )}
      {pins.map((pin) => (
        <Marker
          key={pin.restaurant.id}
          position={[pin.restaurant.latitude!, pin.restaurant.longitude!]}
          icon={pinIcon(pin.status)}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{pin.restaurant.name}</p>
              <p>
                {pin.status} · {formatDistance(pin.distanceMeters)}
              </p>
              <div className="flex flex-col gap-1">
                <a
                  href={googleMapsDirectionsUrl(
                    pin.restaurant,
                    userLocation
                      ? { lat: userLocation.lat, lng: userLocation.lng }
                      : null,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent)] underline"
                >
                  Google Maps
                </a>
                <Link
                  href={`/restaurant/${pin.restaurant.id}`}
                  className="text-[var(--muted)] underline"
                >
                  Open in app
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
