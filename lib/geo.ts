// Extract visitor geolocation from request headers
// Works with Vercel (x-vercel-ip-*) and Cloudflare (cf-ipcity, etc.)

export interface GeoInfo {
  city: string | null
  province: string | null
  country: string | null
}

export function getGeoFromHeaders(headers: Headers): GeoInfo {
  return {
    city:
      headers.get('x-vercel-ip-city') ||
      headers.get('cf-ipcity') ||
      null,
    province:
      headers.get('x-vercel-ip-country-region') ||
      headers.get('cf-region') ||
      null,
    country:
      headers.get('x-vercel-ip-country') ||
      headers.get('cf-ipcountry') ||
      null,
  }
}
