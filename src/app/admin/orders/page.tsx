'use client';

import React, { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ReassignDealerDialog } from '@/components/admin/ReassignDealerDialog';

const statusVariants: { [key in Order['orderStatus']]: string } = {
    Pending: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-500/30',
    Packed: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-500/30',
    'Out for Delivery': 'bg-indigo-500/20 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-500/30',
    Delivered: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/30',
    Cancelled: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-500/30',
    'Not Deliverable': 'bg-gray-500/20 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 border-gray-500/30',
};

function OrderActions({ order }: { order: Order }) {
    const firestore = useFirestore();

    const updateStatus = async (status: Order['orderStatus']) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);
        try {
            await updateDoc(orderRef, { orderStatus: status, updatedAt: serverTimestamp() });
            toast({ title: 'Success', description: `Order ${order.id.slice(0,6)}... updated to ${status}.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order status.'});
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                {['Pending', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'].map(status => (
                    <DropdownMenuItem key={status} onClick={() => updateStatus(status as Order['orderStatus'])}>
                        Mark as {status}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <ReassignDealerDialog order={order}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Reassign Dealer
                    </DropdownMenuItem>
                </ReassignDealerDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function OrdersPage() {
  const firestore = useFirestore();
  
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'));
  }, [firestore]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const sortedOrders = useMemo(() => {
      if (!orders) return [];
      return [...orders].sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);
  }, [orders]);

  return (
    <div className="animate-card-enter">
      <PageHeader title="Manage Orders" subtitle="View and manage all customer orders." />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card className="card-glass">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground h-24">No orders found.</TableCell>
                    </TableRow>
                  )}
                  {sortedOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                      <TableCell>
                          <Badge variant="outline" className={cn(statusVariants[order.orderStatus])}>
                              {order.orderStatus}
                          </Badge>
                      </TableCell>
                      <TableCell>{order.dealerName || 'N/A'}</TableCell>
                      <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                          <OrderActions order={order} />
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
