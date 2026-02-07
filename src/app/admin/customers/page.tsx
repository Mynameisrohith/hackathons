'use client';

import React, { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, UserProfile } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

function calculateCustomerStats(users: UserProfile[] | null, orders: Order[] | null) {
  if (!users || !orders) return [];

  const orderMap = new Map<string, Order[]>();
  for (const order of orders) {
    if (!orderMap.has(order.userId)) orderMap.set(order.userId, []);
    orderMap.get(order.userId)!.push(order);
  }

  return users.map(user => {
    const userOrders = orderMap.get(user.id) || [];
    const totalSpent = userOrders.reduce((sum, o) => o.orderStatus !== 'Cancelled' ? sum + o.totalAmount : sum, 0);
    const orderCount = userOrders.length;
    const avgOrderValue = orderCount > 0 ? totalSpent / userOrders.filter(o => o.orderStatus !== 'Cancelled').length : 0;
    const cancellationRate = orderCount > 0 ? userOrders.filter(o => o.orderStatus === 'Cancelled').length / orderCount : 0;

    return { ...user, orderCount, totalSpent, avgOrderValue, cancellationRate };
  }).sort((a,b) => b.totalSpent - a.totalSpent);
}

export default function CustomersPage() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);

  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);

  const isLoading = loadingUsers || loadingOrders;
  const customerStats = useMemo(() => calculateCustomerStats(users, orders), [users, orders]);

  return (
    <div className="animate-card-enter">
      <PageHeader title="Customer Management" subtitle="View and manage your customer data." />
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Avg. Order Value</TableHead>
                    <TableHead>Cancellation Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerStats.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No customer data available.</TableCell>
                    </TableRow>
                  )}
                  {customerStats.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={customer.photoURL} alt={customer.displayName} />
                          <AvatarFallback>{customer.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{customer.displayName}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{customer.orderCount}</TableCell>
                      <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>${customer.avgOrderValue.toFixed(2)}</TableCell>
                      <TableCell>
                          <Badge variant={customer.cancellationRate > 0.3 ? 'destructive' : 'secondary'}>
                            {(customer.cancellationRate * 100).toFixed(0)}%
                          </Badge>
                      </TableCell>
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
