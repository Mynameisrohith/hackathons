
'use client';

import { getGeocode } from 'use-places-autocomplete';

export interface GeocodedAddress {
    address: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
}

const fallbackLocations: { [key: string]: { lat: number; lng: number } } = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  hubli: { lat: 15.3647, lng: 75.1240 },
};

export async function getGeocodeWithFallback(
  request: google.maps.GeocoderRequest
): Promise<google.maps.GeocoderResult> {
  try {
    const results = await getGeocode(request);
    if (results && results.length > 0) {
      return results[0];
    }
    throw new Error('No results found from Geocoding API');
  } catch (error) {
    console.warn('Geocoding API failed, attempting fallback:', error);
    const addressString = request.address?.toString().toLowerCase() || '';
    
    for (const key in fallbackLocations) {
      if (addressString.includes(key)) {
        console.log(`Fallback triggered for keyword: ${key}`);
        const fallback = fallbackLocations[key];
        // Construct a partial GeocoderResult
        return {
          formatted_address: `Approximation for ${key}, India`,
          geometry: {
            location: {
              lat: () => fallback.lat,
              lng: () => fallback.lng,
            } as google.maps.LatLng,
          },
          address_components: [
            { long_name: key, short_name: key, types: ['locality', 'political'] },
            { long_name: 'India', short_name: 'IN', types: ['country', 'political'] },
          ],
        } as google.maps.GeocoderResult;
      }
    }

    throw new Error('Geocoding failed and no fallback location found.');
  }
}

export async function getReverseGeocode(
  request: google.maps.GeocoderRequest
): Promise<google.maps.GeocoderResult> {
  try {
    const results = await getGeocode(request);
    if (results && results.length > 0) {
      return results[0];
    }
    throw new Error('No results found from reverse Geocoding API');
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    throw new Error('Reverse geocoding failed.');
  }
}

export function extractAddressComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string
): string | null {
  const component = components.find((comp) => comp.types.includes(type));
  return component ? component.long_name : null;
}
