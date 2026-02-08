'use client';

import React, { useMemo } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { collectionGroup, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRole } from '@/hooks/useAdmin';
import type { Order, Store, UserRole } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, BarChart2, Package, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/admin/StatCard';

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
            toast({ title: 'Success', description: `Order updated to ${status}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order status.' });
        }
    }

    const canBePacked = order.orderStatus === 'Pending';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canBePacked}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {canBePacked && (
                    <DropdownMenuItem onClick={() => updateStatus('Packed')}>
                        Mark as Packed
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function DealerDashboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const roleDocRef = useMemoFirebase(() => user ? doc(firestore, 'roles', user.uid) : null, [user, firestore]);
    const { data: roleData, isLoading: isLoadingRole } = useDoc<UserRole>(roleDocRef);

    const storeDocRef = useMemoFirebase(() => {
        if (!roleData?.storeId || !firestore) return null;
        return doc(firestore, 'stores', roleData.storeId);
    }, [roleData, firestore]);
    const { data: store, isLoading: isLoadingStore } = useDoc<Store>(storeDocRef);

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !store?.placeId) return null;
        return query(collectionGroup(firestore, 'orders'), where('dealerPlaceId', '==', store.placeId));
    }, [firestore, store]);

    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

    const sortedOrders = useMemo(() => {
        if (!orders) return [];
        return [...orders].sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    }, [orders]);
    
    const pendingOrdersCount = useMemo(() => orders?.filter(o => o.orderStatus === 'Pending').length || 0, [orders]);

    const isLoading = isLoadingRole || isLoadingStore || isLoadingOrders;

    if (isLoading) {
        return (
             <div>
                <PageHeader title="Dealer Dashboard" subtitle="Loading your store data..."/>
                <main className="p-4 sm:p-6 lg:p-8 space-y-8">
                     <div className="grid gap-4 md:grid-cols-3">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[126px]" />)}
                    </div>
                    <Skeleton className="h-96 w-full" />
                </main>
            </div>
        )
    }
    
    if (!store) {
        return (
            <div>
                <PageHeader title="Dealer Dashboard Error" subtitle="Could not load your assigned store."/>
                <main className="p-4 sm:p-6 lg:p-8">
                    <Card>
                        <CardHeader><CardTitle>Store Not Found</CardTitle></CardHeader>
                        <CardContent>
                            <p>Your user account is not associated with a store. Please contact an administrator to have a store assigned to your dealer account.</p>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div>
            <PageHeader title={store.name} subtitle="View and manage all orders assigned to you." />
            <main className="p-4 sm:p-6 lg:p-8 space-y-8">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Pending Orders" value={pendingOrdersCount.toString()} icon={Package} />
                    <StatCard title="Inventory Insights" value="Coming Soon" icon={BarChart2} />
                    <StatCard title="Stock Alerts" value="Coming Soon" icon={AlertTriangle} />
                </div>
                <Card className="card-glass">
                    <CardHeader><CardTitle>Assigned Orders</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedOrders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">No orders assigned to you yet.</TableCell>
                                    </TableRow>
                                )}
                                {sortedOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                        <TableCell>{order.customerName}</TableCell>
                                        <TableCell>{new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(statusVariants[order.orderStatus])}>
                                                {order.orderStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <OrderActions order={order} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
