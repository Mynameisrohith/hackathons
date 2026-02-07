'use client';

import React, { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, Store } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import LiveTrackingMap from '@/components/admin/LiveTrackingMap';


export default function LiveTrackingPage() {
  const firestore = useFirestore();

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

  return (
    <div className="flex flex-col h-screen">
      <PageHeader title="Live Delivery Tracking" subtitle="Monitor all active deliveries in real-time." />
      <main className="flex-1 p-4 md:p-8">
        <div className="h-full w-full rounded-lg shadow-lg">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <LiveTrackingMap activeOrders={activeOrders || []} stores={stores || []} />
          )}
        </div>
      </main>
    </div>
  );
}
