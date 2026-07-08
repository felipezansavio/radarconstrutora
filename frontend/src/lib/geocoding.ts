export interface GeocodeResult {
  latitude: number;
  longitude: number;
  label: string;
}

/**
 * Geocodificação client-side via Nominatim (OpenStreetMap), sem necessidade
 * de chave de API. Usada apenas para converter cidade/estado/CEP em
 * coordenadas antes de consultar /search/radius.
 */
export async function geocodeAddress(
  query: string,
): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("q", query);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return null;

  const results = (await res.json()) as {
    lat: string;
    lon: string;
    display_name: string;
  }[];

  const first = results[0];
  if (!first) return null;

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    label: first.display_name,
  };
}
