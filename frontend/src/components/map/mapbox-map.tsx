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
}

export interface MapOrigin {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

interface MapboxMapProps {
  markers: MapMarker[];
  origin?: MapOrigin | null;
  onMarkerClick?: (id: string) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const RADIUS_SOURCE_ID = "radar-search-radius";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Aproxima um círculo geodésico (em km) como um polígono GeoJSON. */
function createRadiusCircle(
  center: [number, number],
  radiusKm: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center;
  const kmPerDegreeLat = 110.574;
  const kmPerDegreeLng = 111.32 * Math.cos((lat * Math.PI) / 180);

  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = (radiusKm * Math.cos(angle)) / kmPerDegreeLng;
    const dy = (radiusKm * Math.sin(angle)) / kmPerDegreeLat;
    coordinates.push([lng + dx, lat + dy]);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coordinates] },
  };
}

export function MapboxMap({ markers, origin, onMarkerClick }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);

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

    if (markers.length === 0 && !origin) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const point of markers) {
      const marker = new mapboxgl.Marker({ color: point.color ?? "#2a78d6" })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map);

      const el = marker.getElement();
      el.style.cursor = "pointer";
      if (onMarkerClick) {
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          onMarkerClick(point.id);
        });
      } else {
        marker.setPopup(
          new mapboxgl.Popup({ offset: 16 }).setHTML(
            `<div style="font-weight:600;">${escapeHtml(point.label)}</div>`,
          ),
        );
      }

      markerRefs.current.push(marker);
      bounds.extend([point.longitude, point.latitude]);
    }

    if (origin) {
      bounds.extend([origin.longitude, origin.latitude]);
    }

    map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 0 });
  }, [markers, origin, onMarkerClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !MAPBOX_TOKEN) return;

    function syncOrigin() {
      if (!map) return;

      originMarkerRef.current?.remove();
      originMarkerRef.current = null;
      if (map.getLayer(`${RADIUS_SOURCE_ID}-fill`)) {
        map.removeLayer(`${RADIUS_SOURCE_ID}-fill`);
      }
      if (map.getLayer(`${RADIUS_SOURCE_ID}-line`)) {
        map.removeLayer(`${RADIUS_SOURCE_ID}-line`);
      }
      if (map.getSource(RADIUS_SOURCE_ID)) {
        map.removeSource(RADIUS_SOURCE_ID);
      }

      if (!origin) return;

      originMarkerRef.current = new mapboxgl.Marker({ color: "#111827" })
        .setLngLat([origin.longitude, origin.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 16 }).setHTML(
            "<div style='font-weight:600;'>Ponto de busca</div>",
          ),
        )
        .addTo(map);

      if (origin.radiusKm) {
        const circle = createRadiusCircle(
          [origin.longitude, origin.latitude],
          origin.radiusKm,
        );
        map.addSource(RADIUS_SOURCE_ID, { type: "geojson", data: circle });
        map.addLayer({
          id: `${RADIUS_SOURCE_ID}-fill`,
          type: "fill",
          source: RADIUS_SOURCE_ID,
          paint: { "fill-color": "#2a78d6", "fill-opacity": 0.08 },
        });
        map.addLayer({
          id: `${RADIUS_SOURCE_ID}-line`,
          type: "line",
          source: RADIUS_SOURCE_ID,
          paint: { "line-color": "#2a78d6", "line-width": 1.5 },
        });
      }
    }

    if (map.isStyleLoaded()) {
      syncOrigin();
    } else {
      map.once("load", syncOrigin);
    }
  }, [origin]);

  if (!MAPBOX_TOKEN) {
    return null;
  }

  return <div ref={containerRef} className="h-full w-full rounded-xl" />;
}

export const isMapboxConfigured = Boolean(MAPBOX_TOKEN);
