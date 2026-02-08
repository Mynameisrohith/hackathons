'use client';

import React, { useMemo, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, OverlayView } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { DeliveryTruckIcon } from '@/components/icons';
import type { Order, Store } from '@/lib/types';
import { cn } from '@/lib/utils';


interface LiveTrackingMapProps {
  activeOrders: Order[];
  stores: Store[];
  selectedOrder: Order | null;
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

function LiveTrackingMap({ activeOrders, stores, selectedOrder }: LiveTrackingMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const mapBounds = useMemo(() => {
    if (!isLoaded) return undefined;
    const bounds = new window.google.maps.LatLngBounds();

    if (selectedOrder) {
      if (selectedOrder.dealerLat && selectedOrder.dealerLng) {
        bounds.extend({ lat: selectedOrder.dealerLat, lng: selectedOrder.dealerLng });
      }
      bounds.extend({ lat: selectedOrder.latitude, lng: selectedOrder.longitude });
      if (selectedOrder.deliveryBoyLat && selectedOrder.deliveryBoyLng) {
        bounds.extend({ lat: selectedOrder.deliveryBoyLat, lng: selectedOrder.deliveryBoyLng });
      }
    } else {
      stores.forEach(store => bounds.extend({ lat: store.latitude, lng: store.longitude }));
      activeOrders.forEach(order => {
        bounds.extend({ lat: order.latitude, lng: order.longitude });
        if (order.deliveryBoyLat && order.deliveryBoyLng) {
          bounds.extend({ lat: order.deliveryBoyLat, lng: order.deliveryBoyLng });
        }
      });
    }
    return bounds;
  }, [isLoaded, activeOrders, stores, selectedOrder]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (mapRef.current && mapBounds && !mapBounds.isEmpty()) {
      mapRef.current.fitBounds(mapBounds, selectedOrder ? 80 : 60);
    }
  }, [selectedOrder, mapBounds]);
  
  if (loadError) return <div className='flex items-center justify-center h-full bg-destructive/10 text-destructive rounded-xl'><p>Map cannot be loaded right now</p></div>;
  if (!isLoaded) return <Skeleton className="w-full h-full rounded-xl" />;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      options={mapOptions}
      onLoad={onLoad}
      onUnmount={onUnmount}
      center={mapBounds?.getCenter()}
    >
        {/* Store Markers */}
        {stores.map(store => {
          const isSelected = selectedOrder?.dealerPlaceId === store.placeId;
          return (
            <MarkerF 
                key={`store-${store.id}`} 
                position={{ lat: store.latitude, lng: store.longitude }} 
                title={store.name}
                icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: isSelected ? 10 : 8,
                    fillColor: 'hsl(var(--primary))',
                    fillOpacity: isSelected ? 1 : 0.8,
                    strokeWeight: 2,
                    strokeColor: 'white',
                }}
                zIndex={isSelected ? 10 : 1}
            />
          );
        })}

        {/* Active Order Markers */}
        {activeOrders.map(order => {
            const isSelected = selectedOrder?.id === order.id;
            return (
                <React.Fragment key={`order-track-${order.id}`}>
                    {/* Customer Marker */}
                    <MarkerF
                        position={{ lat: order.latitude, lng: order.longitude }}
                        title={`Customer: ${order.customerName}`}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: isSelected ? 10 : 8,
                            fillColor: 'hsl(var(--accent))',
                            fillOpacity: isSelected ? 1 : 0.7,
                            strokeWeight: 2,
                            strokeColor: 'white',
                        }}
                        zIndex={isSelected ? 10 : 1}
                    />
                    
                    {/* Delivery Boy Marker */}
                    {order.deliveryBoyLat && order.deliveryBoyLng && (
                        <OverlayView
                            position={{ lat: order.deliveryBoyLat, lng: order.deliveryBoyLng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div 
                              style={{transform: 'translate(-50%, -50%)', zIndex: isSelected ? 20 : 5}}
                              className={cn(
                                'p-2 bg-primary rounded-full shadow-lg transition-all duration-1000 ease-linear',
                                isSelected && 'animate-pulse'
                              )}
                            >
                                <DeliveryTruckIcon className="w-6 h-6 text-primary-foreground" />
                            </div>
                        </OverlayView>
                    )}
                </React.Fragment>
            )
        })}
    </GoogleMap>
  );
}

export default LiveTrackingMap;
    
