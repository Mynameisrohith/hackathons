
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';
import { collectionGroup, query, where } from 'firebase/firestore';
import { useLanguage } from '@/context/LanguageContext';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, Polyline } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAdmin } from '@/hooks/useAdmin';
import { DeliveryTruckIcon } from '@/components/icons';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.75rem',
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
};

const libraries: "places"[] = ['places'];

export default function LiveTrackingPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const [activeMarker, setActiveMarker] = useState<string | null>(null);
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries,
    });
    
    const activeOrdersQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return query(
            collectionGroup(firestore, 'orders'),
            where('orderStatus', '==', 'Out for Delivery')
        );
    }, [firestore, isAdmin]);

    const { data: activeOrders, isLoading: isLoadingOrders } = useCollection<Order>(activeOrdersQuery);

    const bounds = useMemo(() => {
        if (!activeOrders || activeOrders.length === 0 || typeof window === 'undefined') return undefined;
        const b = new window.google.maps.LatLngBounds();
        activeOrders.forEach(order => {
            if (order.deliveryBoyLat && order.deliveryBoyLng) {
                b.extend({ lat: order.deliveryBoyLat, lng: order.deliveryBoyLng });
            }
            b.extend({ lat: order.latitude, lng: order.longitude }); // customer
            b.extend({ lat: order.dealerLat, lng: order.dealerLng }); // dealer
        });
        return b;
    }, [activeOrders]);

    const isLoading = isAdminLoading || isLoadingOrders || !isLoaded;

    if (loadError) return <div className="flex items-center justify-center h-full w-full rounded-xl bg-destructive/20 text-destructive-foreground">Map cannot be loaded right now, sorry.</div>;
    
    if (isLoading || !isAdmin) {
        return (
            <Card className="card-glass w-full h-[85vh] p-0">
                <Skeleton className="absolute top-2 left-2 z-10 h-16 w-64" />
                <Skeleton className="w-full h-full" />
            </Card>
        )
    }

    return (
        <Card className="card-glass w-full h-[85vh] p-0">
             <CardHeader className="absolute top-2 left-2 z-10 bg-black/50 p-4 rounded-lg card-glass">
                <CardTitle>{t('liveTracking')}</CardTitle>
             </CardHeader>
             <div className="w-full h-full">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    options={mapOptions}
                    onLoad={map => bounds && map.fitBounds(bounds, 60)}
                >
                    {activeOrders?.map(order => (
                        <React.Fragment key={order.id}>
                            {/* Store Marker */}
                            <MarkerF 
                                position={{ lat: order.dealerLat, lng: order.dealerLng }} 
                                title={`Store: ${order.dealerName}`}
                                icon={{
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: 5,
                                    fillColor: 'hsl(var(--secondary-foreground))',
                                    fillOpacity: 1,
                                    strokeWeight: 2,
                                    strokeColor: 'white',
                                }}
                            />
                            {/* Customer Marker */}
                            <MarkerF 
                                position={{ lat: order.latitude, lng: order.longitude }} 
                                title={`Customer: ${order.customerName}`}
                                icon={{
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: 5,
                                    fillColor: 'hsl(var(--accent))',
                                    fillOpacity: 1,
                                    strokeWeight: 2,
                                    strokeColor: 'white',
                                }}
                            />
                            {/* Delivery Boy Marker */}
                            {order.deliveryBoyLat && order.deliveryBoyLng && (
                                <MarkerF
                                    position={{ lat: order.deliveryBoyLat, lng: order.deliveryBoyLng }}
                                    title={`Delivery: ${order.deliveryBoyName}`}
                                    onClick={() => setActiveMarker(order.id)}
                                    icon={{
                                        path: "M-1.54,23.82l-1.28-1.28a1.68,1.68,0,0,1,0-2.37l7.39-7.39a1.68,1.68,0,0,1,2.37,0l7.39,7.39a1.68,1.68,0,0,1,0,2.37l-1.28,1.28a1.68,1.68,0,0,1-2.37,0L10.3,18.44a1.68,1.68,0,0,0-2.37,0l-5.39,5.39A1.68,1.68,0,0,1-1.54,23.82ZM12.67,2.37,5.28,9.76a1.68,1.68,0,0,0,0,2.37L6.56,13.4a1.68,1.68,0,0,0,2.37,0L18.44,4a1.68,1.68,0,0,1,2.37,0l1.28,1.28a1.68,1.68,0,0,1,0,2.37L14.7,15.05a1.68,1.68,0,0,0,0,2.37l1.28,1.28a1.68,1.68,0,0,0,2.37,0l7.39-7.39a1.68,1.68,0,0,0,0-2.37L24.46,7.66a1.68,1.68,0,0,0-2.37,0L12.67,17.08a1.68,1.68,0,0,1-2.37,0L-.44,6.74A1.68,1.68,0,0,0-1.72,8l-1.28,1.28a1.68,1.68,0,0,0,0,2.37L5.28,20.15a1.68,1.68,0,0,0,2.37,0L17.08,10.7a1.68,1.68,0,0,1,2.37,0L20.73,12a1.68,1.68,0,0,1,0,2.37l-7.39,7.39a1.68,1.68,0,0,1-2.37,0L-5.39,5.39a1.68,1.68,0,0,1,0-2.37L-4.11,1.74a1.68,1.68,0,0,1,2.37,0Z",
                                        anchor: new google.maps.Point(0, 0),
                                        fillColor: "hsl(var(--primary))",
                                        fillOpacity: 1,
                                        strokeColor: "white",
                                        strokeWeight: 1,
                                        scale: 1.5,
                                    }}
                                >
                                    {activeMarker === order.id && (
                                        <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                                            <div className="text-black p-1">
                                                <h4 className="font-bold">{order.deliveryBoyName}</h4>
                                                <p>Order: {order.id.substring(0, 6)}...</p>
                                                <p>To: {order.customerName}</p>
                                            </div>
                                        </InfoWindowF>
                                    )}
                                </MarkerF>
                            )}
                            {/* Route Polyline */}
                            <Polyline
                                path={[{ lat: order.dealerLat, lng: order.dealerLng }, { lat: order.latitude, lng: order.longitude }]}
                                options={{ strokeColor: '#FFFFFF', strokeOpacity: 0.2, strokeWeight: 2 }}
                            />
                        </React.Fragment>
                    ))}
                </GoogleMap>
             </div>
        </Card>
    );
}
