
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

  // Fetch all orders and filter/sort client-side to avoid needing a composite index on a collection group query
  const allOrdersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'));
  }, [firestore]);

  const storesQuery = useMemoFirebase(() => {
      if(!firestore) return null;
      return collection(firestore, 'stores');
  }, [firestore]);

  const { data: allOrders, isLoading: isLoadingOrders } = useCollection<Order>(allOrdersQuery);
  const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(storesQuery);
  
  const activeOrders = useMemo(() => {
      if (!allOrders) return [];
      // Sort orders descending by creation date, then filter for active ones
      const sortedOrders = [...allOrders].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      return sortedOrders.filter(order => order.orderStatus === 'Out for Delivery');
  }, [allOrders]);
  
  const isLoading = isLoadingOrders || isLoadingStores;

  return (
    <>
      <PageHeader title="Live Delivery Tracking" subtitle="Monitor all active deliveries in real-time." />
      <main className="p-8">
        <div className="h-[75vh] w-full rounded-lg shadow-lg">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <LiveTrackingMap activeOrders={activeOrders || []} stores={stores || []} />
          )}
        </div>
      </main>
    </>
  );
}
