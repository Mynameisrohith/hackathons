'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, Store } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import LiveTrackingMap from '@/components/admin/LiveTrackingMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Package } from 'lucide-react';
import { cn } from '@/lib/utils';


export default function LiveTrackingPage() {
  const firestore = useFirestore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Fetch all orders using a safe collection group query
  const allOrdersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'));
  }, [firestore]);

  // Fetch all stores
  const storesQuery = useMemoFirebase(() => {
      if(!firestore) return null;
      return collection(firestore, 'stores');
  }, [firestore]);

  const { data: allOrders, isLoading: isLoadingOrders } = useCollection<Order>(allOrdersQuery);
  const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(storesQuery);
  
  // Filter for active orders on the client-side
  const activeOrders = useMemo(() => {
      if (!allOrders) return [];
      return allOrders.filter(order => order.orderStatus === 'Out for Delivery');
  }, [allOrders]);
  
  const isLoading = isLoadingOrders || isLoadingStores;

  const selectedOrder = useMemo(() => {
    return activeOrders.find(o => o.id === selectedOrderId) ?? null;
  }, [activeOrders, selectedOrderId]);

  return (
    <div className="flex flex-col h-screen">
      <PageHeader title="Live Delivery Tracking" subtitle="Monitor all active deliveries in real-time." />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-8">
        <div className="lg:col-span-2 h-full min-h-[50vh] lg:min-h-0 w-full rounded-lg shadow-lg">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <LiveTrackingMap 
                activeOrders={activeOrders || []} 
                stores={stores || []}
                selectedOrder={selectedOrder} 
            />
          )}
        </div>
        <div className="lg:col-span-1 overflow-y-auto">
            <Card className="card-glass">
                <CardHeader>
                    <CardTitle>Active Deliveries ({activeOrders.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading ? (
                        [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                     ) : activeOrders.length > 0 ? (
                        activeOrders.map(order => (
                            <Card 
                                key={order.id} 
                                className={cn('cursor-pointer transition-all hover:bg-muted/50', selectedOrderId === order.id && 'ring-2 ring-primary bg-muted/50')}
                                onClick={() => setSelectedOrderId(order.id === selectedOrderId ? null : order.id)}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-mono flex justify-between">
                                        #{order.id.slice(0, 6)}...
                                        <Badge variant="secondary">{order.deliveryStatus}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>To: {order.customerName}</span>
                                    </div>
                                     <div className="flex items-center gap-2 text-muted-foreground">
                                        <Package className="h-4 w-4" />
                                        <span>By: {order.deliveryBoyName}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                     ) : (
                        <p className="text-center text-muted-foreground p-8">No active deliveries.</p>
                     )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
