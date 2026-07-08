"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  color?: string;
  href?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export function MapboxMap({ markers }: { markers: MapMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-46.6333, -23.5505],
      zoom: 10,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !MAPBOX_TOKEN) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    if (markers.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const point of markers) {
      const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(
        `<a href="${point.href ?? "#"}" style="font-weight:600;">${point.label}</a>`,
      );
      const marker = new mapboxgl.Marker({ color: point.color ?? "#2a78d6" })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(popup)
        .addTo(map);
      markerRefs.current.push(marker);
      bounds.extend([point.longitude, point.latitude]);
    }

    map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 0 });
  }, [markers]);

  if (!MAPBOX_TOKEN) {
    return null;
  }

  return <div ref={containerRef} className="h-full w-full rounded-xl" />;
}

export const isMapboxConfigured = Boolean(MAPBOX_TOKEN);
