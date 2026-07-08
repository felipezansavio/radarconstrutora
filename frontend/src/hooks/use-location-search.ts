"use client";

import { useState } from "react";
import { toast } from "sonner";

import { geocodeAddress } from "@/lib/geocoding";

export function useLocationSearch() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setLocationLabel("Minha localização atual");
      },
      () => toast.error("Não foi possível obter sua localização."),
    );
  }

  async function resolveCoordinates(): Promise<{
    latitude: number;
    longitude: number;
  } | null> {
    let lat = latitude ? Number(latitude) : undefined;
    let lng = longitude ? Number(longitude) : undefined;

    if ((!lat || !lng) && (city || zipCode)) {
      setGeocoding(true);
      const query = [zipCode, city, state, "Brasil"]
        .filter(Boolean)
        .join(", ");
      let geo = null;
      try {
        geo = await geocodeAddress(query);
      } catch {
        geo = null;
      } finally {
        setGeocoding(false);
      }
      if (!geo) {
        toast.error(
          "Não foi possível localizar esse endereço. Tente informar as coordenadas diretamente.",
        );
        return null;
      }
      lat = geo.latitude;
      lng = geo.longitude;
      setLatitude(String(geo.latitude));
      setLongitude(String(geo.longitude));
      setLocationLabel(geo.label);
    }

    if (!lat || !lng) {
      toast.error("Informe uma cidade, CEP ou coordenadas para buscar.");
      return null;
    }

    return { latitude: lat, longitude: lng };
  }

  return {
    city,
    setCity,
    state,
    setState,
    zipCode,
    setZipCode,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    locationLabel,
    geocoding,
    useBrowserLocation,
    resolveCoordinates,
  };
}
