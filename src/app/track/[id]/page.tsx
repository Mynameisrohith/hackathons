
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Order } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useLanguage } from '@/context/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, MapPin, Phone, User, Clock } from 'lucide-react';
import { useDeliveryTracker } from '@/lib/delivery-tracker';
import TrackOrderMap from '@/components/TrackOrderMap';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const deliverySteps = ['Assigned', 'Picked', 'Out for Delivery', 'Delivered'];

function TrackingPageSkeleton() {
  return (
    <>
      <PageHeader title="Tracking Order..." />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[60vh]">
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="w-full h-48 rounded-xl" />
            <Skeleton className="w-full h-32 rounded-xl" />
          </div>
        </div>
      </main>
    </>
  );
}


export default function TrackOrderPage() {
  const { t } = useLanguage();
  const params = useParams();
  const orderId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const orderDocRef = useMemoFirebase(() => {
    if (!user || !firestore || !orderId) return null;
    return doc(firestore, 'users', user.uid, 'orders', orderId);
  }, [user, firestore, orderId]);

  const { data: order, isLoading } = useDoc<Order>(orderDocRef);

  // This hook contains the simulation logic
  useDeliveryTracker(order);

  if (isLoading || !order) {
    return <TrackingPageSkeleton />;
  }
  
  const deliveryStatus = order.deliveryStatus || 'Assigned';
  const currentStepIndex = deliverySteps.indexOf(deliveryStatus);
  const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / deliverySteps.length) * 100 : 0;
  
  const storeLocation = { lat: order.dealerLat, lng: order.dealerLng };
  const customerLocation = { lat: order.latitude, lng: order.longitude };
  const deliveryBoyLocation = (order.deliveryBoyLat && order.deliveryBoyLng) 
    ? { lat: order.deliveryBoyLat, lng: order.deliveryBoyLng }
    : null;

  return (
    <>
      <PageHeader title="Track Your Delivery" subtitle={`Order ID: ${order.id}`} />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map Section */}
            <div className="lg:col-span-2 h-[60vh] rounded-xl shadow-lg">
                <TrackOrderMap 
                    storeLocation={storeLocation}
                    customerLocation={customerLocation}
                    deliveryBoyLocation={deliveryBoyLocation}
                />
            </div>
            {/* Details Section */}
            <div className="space-y-6">
                <Card className="card-glass">
                    <CardHeader>
                        <CardTitle>Delivery Status</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='text-center'>
                           <Badge variant="default" className="text-lg">{deliveryStatus}</Badge>
                        </div>
                        <Progress value={progressPercentage} className="h-2"/>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            {deliverySteps.map(step => (
                                <span key={step}>{step}</span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                 <Card className="card-glass">
                    <CardHeader>
                        <CardTitle>Estimated Arrival</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Clock className="w-10 h-10 text-primary"/>
                        <div>
                             <p className="text-3xl font-bold">
                                {order.estimatedArrivalMinutes !== undefined ? `${order.estimatedArrivalMinutes} min` : 'Calculating...'}
                            </p>
                            <p className='text-sm text-muted-foreground'>ETA may vary based on traffic and weather.</p>
                        </div>
                    </CardContent>
                </Card>

                {order.deliveryBoyName && (
                    <Card className="card-glass">
                        <CardHeader>
                            <CardTitle>Your Delivery Partner</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-muted-foreground"/>
                                <span>{order.deliveryBoyName}</span>
                            </div>
                             <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-muted-foreground"/>
                                <span>{order.deliveryBoyPhone || 'Not available'}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </main>
    </>
  );
}
