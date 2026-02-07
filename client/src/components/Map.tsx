import "mapbox-gl/dist/mapbox-gl.css";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type MapMarker = {
  position: { lat: number; lng: number };
  title?: string;
};

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  marker?: MapMarker;
  onMapReady?: (map: mapboxgl.Map) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  marker,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      console.error("Missing VITE_MAPBOX_ACCESS_TOKEN");
      return;
    }

    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      onMapReady?.(map);
    });

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter.lat, initialCenter.lng, initialZoom, onMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !marker) return;

    markerRef.current?.remove();
    markerRef.current = new mapboxgl.Marker()
      .setLngLat([marker.position.lng, marker.position.lat])
      .setPopup(
        marker.title ? new mapboxgl.Popup().setText(marker.title) : null
      )
      .addTo(map);
  }, [marker]);

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}
