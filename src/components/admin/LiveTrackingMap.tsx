'use client';

import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, OverlayView } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Store as StoreIcon } from 'lucide-react';
import { DeliveryTruckIcon } from '@/components/icons';
import type { Order, Store } from '@/lib/types';

interface LiveTrackingMapProps {
  activeOrders: Order[];
  stores: Store[];
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

function LiveTrackingMap({ activeOrders, stores }: LiveTrackingMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const mapBounds = useMemo(() => {
    if (!isLoaded) return undefined;
    const bounds = new window.google.maps.LatLngBounds();
    
    stores.forEach(store => bounds.extend({ lat: store.latitude, lng: store.longitude }));
    
    activeOrders.forEach(order => {
        // Customer location
        bounds.extend({ lat: order.latitude, lng: order.longitude });
        // Delivery person location
        if (order.deliveryBoyLat && order.deliveryBoyLng) {
            bounds.extend({ lat: order.deliveryBoyLat, lng: order.deliveryBoyLng });
        }
    });

    return bounds;
  }, [isLoaded, activeOrders, stores]);
  
  if (loadError) return <div className='flex items-center justify-center h-full bg-destructive/10 text-destructive rounded-xl'><p>Map cannot be loaded right now</p></div>;
  if (!isLoaded) return <Skeleton className="w-full h-full rounded-xl" />;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      options={mapOptions}
      onLoad={map => {
          if (mapBounds && !mapBounds.isEmpty()) {
              map.fitBounds(mapBounds, 60)
          }
      }}
    >
        {/* Store Markers */}
        {stores.map(store => (
            <MarkerF 
                key={`store-${store.id}`} 
                position={{ lat: store.latitude, lng: store.longitude }} 
                title={store.name}
                icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: 'hsl(var(--primary))',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: 'white',
                }}
            />
        ))}

        {/* Active Order Markers */}
        {activeOrders.map(order => (
            <React.Fragment key={`order-track-${order.id}`}>
                {/* Customer Marker */}
                <MarkerF
                    position={{ lat: order.latitude, lng: order.longitude }}
                    title={`Customer: ${order.customerName}`}
                />
                
                {/* Delivery Boy Marker */}
                {order.deliveryBoyLat && order.deliveryBoyLng && (
                    <OverlayView
                        position={{ lat: order.deliveryBoyLat, lng: order.deliveryBoyLng }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div className='p-2 bg-primary rounded-full shadow-lg transition-all duration-1000 ease-linear'>
                            <DeliveryTruckIcon className="w-6 h-6 text-primary-foreground" />
                        </div>
                    </OverlayView>
                )}
            </React.Fragment>
        ))}
    </GoogleMap>
  );
}

export default LiveTrackingMap;
    