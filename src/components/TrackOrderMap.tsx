'use client';

import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, Polyline, OverlayView } from '@react-google-maps/api';
import { Skeleton } from './ui/skeleton';
import { MapPin, Store, Truck } from 'lucide-react';
import { DeliveryTruckIcon } from './icons';

interface TrackOrderMapProps {
  storeLocation: { lat: number; lng: number };
  customerLocation: { lat: number; lng: number };
  deliveryBoyLocation: { lat: number; lng: number } | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem',
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

const libraries: "places"[] = ['places'];

function TrackOrderMap({ storeLocation, customerLocation, deliveryBoyLocation }: TrackOrderMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const mapCenter = useMemo(() => {
    return {
      lat: (storeLocation.lat + customerLocation.lat) / 2,
      lng: (storeLocation.lng + customerLocation.lng) / 2,
    };
  }, [storeLocation, customerLocation]);

  const mapBounds = useMemo(() => {
    if (!isLoaded) return undefined;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(storeLocation);
    bounds.extend(customerLocation);
    if(deliveryBoyLocation) {
        bounds.extend(deliveryBoyLocation);
    }
    return bounds;
  }, [isLoaded, storeLocation, customerLocation, deliveryBoyLocation]);

  const routePath = useMemo(() => [storeLocation, customerLocation], [storeLocation, customerLocation]);
  
  if (loadError) return <div className='flex items-center justify-center h-full bg-destructive/10 text-destructive rounded-xl'><p>Map cannot be loaded right now</p></div>;
  if (!isLoaded) return <Skeleton className="w-full h-full rounded-xl" />;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      options={mapOptions}
      onLoad={map => {
        if(mapBounds && !mapBounds.isEmpty()) {
            map.fitBounds(mapBounds, 60)
        }
      }}
    >
        {/* Store Marker */}
        <MarkerF position={storeLocation} title="Store" icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: 'white',
        }}/>

        {/* Customer Marker */}
        <MarkerF position={customerLocation} title="You" icon={{
             path: window.google.maps.SymbolPath.CIRCLE,
             scale: 8,
             fillColor: 'hsl(var(--accent))',
             fillOpacity: 1,
             strokeWeight: 2,
             strokeColor: 'white',
        }}/>
      
        {/* Delivery Boy Marker */}
        {deliveryBoyLocation && (
            <OverlayView
                position={deliveryBoyLocation}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
                <div className='p-2 bg-primary rounded-full shadow-lg transition-all duration-1000 ease-linear'>
                    <DeliveryTruckIcon className="w-6 h-6 text-primary-foreground" />
                </div>
            </OverlayView>
        )}

        {/* Route Polyline */}
        <Polyline
            path={routePath}
            options={{
                strokeColor: '#000000',
                strokeOpacity: 0.5,
                strokeWeight: 4,
                icons: [
                    {
                        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                        offset: '0',
                        repeat: '20px',
                    },
                ],
            }}
        />
    </GoogleMap>
  );
}

export default TrackOrderMap;
