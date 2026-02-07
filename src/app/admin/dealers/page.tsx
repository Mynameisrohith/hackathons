'use client';

import React, { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, Store } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

function calculateDealerStats(stores: Store[] | null, orders: Order[] | null) {
    if (!stores || !orders) return [];

    return stores.map(store => {
        const assignedOrders = orders.filter(o => o.dealerPlaceId === store.placeId);
        const completedOrders = assignedOrders.filter(o => o.orderStatus === 'Delivered').length;
        const completionRate = assignedOrders.length > 0 ? (completedOrders / assignedOrders.length) : 0;
        const totalRevenue = assignedOrders.reduce((sum, o) => o.orderStatus === 'Delivered' ? sum + o.totalAmount : sum, 0);

        return {
            ...store,
            orderCount: assignedOrders.length,
            completionRate,
            totalRevenue,
        }
    }).sort((a,b) => b.totalRevenue - a.totalRevenue);
}

export default function DealersPage() {
  const firestore = useFirestore();

  const storesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stores')) : null, [firestore]);
  const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);
  
  const { data: stores, isLoading: loadingStores } = useCollection<Store>(storesQuery);
  const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);

  const isLoading = loadingStores || loadingOrders;
  const dealerStats = useMemo(() => calculateDealerStats(stores, orders), [stores, orders]);

  return (
    <div className="animate-card-enter">
      <PageHeader title="Dealer Management" subtitle="View and manage all registered dealers and their performance." />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card className="card-glass">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Orders</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {dealerStats.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">No dealers registered yet.</TableCell>
                    </TableRow>
                  )}
                  {dealerStats.map(dealer => (
                    <TableRow key={dealer.id}>
                      <TableCell className="font-medium">{dealer.name}</TableCell>
                      <TableCell>{dealer.address}</TableCell>
                      <TableCell>
                          <Badge variant={dealer.active ? 'default' : 'destructive'} className="bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/30">
                              <Circle className="mr-2 h-2 w-2 fill-current"/>
                              {dealer.active ? 'Active' : 'Inactive'}
                          </Badge>
                      </TableCell>
                      <TableCell>{dealer.orderCount}</TableCell>
                      <TableCell>{(dealer.completionRate * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-right">${dealer.totalRevenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
