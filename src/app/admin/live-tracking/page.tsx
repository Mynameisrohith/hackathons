
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';
import { collectionGroup, query, where } from 'firebase/firestore';
import { useLanguage } from '@/context/LanguageContext';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, Polyline } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Store, User, Truck } from 'lucide-react';
import { DeliveryTruckIcon } from '@/components/icons';
import { useAdmin } from '@/hooks/useAdmin';

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

    const isLoading = isAdminLoading || isLoadingOrders;

    if (loadError) return <div>Map cannot be loaded right now, sorry.</div>;

    return (
        <Card className="card-glass w-full h-[85vh] p-0">
             <CardHeader className="absolute top-2 left-2 z-10 bg-black/50 p-4 rounded-lg card-glass">
                <CardTitle>{t('liveTracking')}</CardTitle>
             </CardHeader>
             <div className="w-full h-full">
                {!isLoaded || isLoading ? <Skeleton className="w-full h-full" /> : (
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
                )}
             </div>
        </Card>
    );
}

// "liveTracking": "Live Delivery Tracking"
