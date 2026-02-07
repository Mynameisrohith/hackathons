
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { collection, query, doc, updateDoc, writeBatch, collectionGroup } from 'firebase/firestore';
import type { Order, Store } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';

interface DealerStat extends Store {
    totalOrders: number;
    totalRevenue: number;
}

export default function AdminDealersPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const storesQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collection(firestore, 'stores')) : null, [firestore, isAdmin]);
    const ordersQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collectionGroup(firestore, 'orders')) : null, [firestore, isAdmin]);

    const { data: stores, isLoading: loadingStores } = useCollection<Store>(storesQuery);
    const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);

    const dealerStats: DealerStat[] | null = useMemo(() => {
        if (!stores || !orders) return null;

        const orderMap = new Map<string, Order[]>();
        orders.forEach(order => {
            const dealerId = order.dealerPlaceId; // Assuming dealerPlaceId is the link
            if (!dealerId) return;
            if (!orderMap.has(dealerId)) {
                orderMap.set(dealerId, []);
            }
            orderMap.get(dealerId)!.push(order);
        });

        return stores.map(store => {
            const dealerOrders = orderMap.get(store.placeId!) || [];
            const totalOrders = dealerOrders.length;
            const totalRevenue = dealerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            return {
                ...store,
                totalOrders,
                totalRevenue,
            };
        }).sort((a,b) => b.totalRevenue - a.totalRevenue);
    }, [stores, orders]);

    const handleStatusChange = async (storeId: string, currentStatus: boolean) => {
        if(!firestore) return;
        const storeRef = doc(firestore, 'stores', storeId);
        try {
            await updateDoc(storeRef, { active: !currentStatus });
            toast({ title: 'Success', description: `Dealer status updated.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update dealer status.'});
        }
    }

    const isLoading = isAdminLoading || loadingStores || loadingOrders;

    return (
        <Card className="card-glass">
            <CardHeader>
                <CardTitle>{t('dealerManagement')}</CardTitle>
                <CardDescription>{t('dealerManagementDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('dealer')}</TableHead>
                            <TableHead>{t('location')}</TableHead>
                            <TableHead>{t('totalOrders')}</TableHead>
                            <TableHead>{t('totalRevenue')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                            <TableHead>{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                                </TableRow>
                            ))
                        ) : dealerStats && dealerStats.length > 0 ? (
                            dealerStats.map(dealer => (
                                <TableRow key={dealer.id}>
                                    <TableCell className="font-medium">{dealer.name}</TableCell>
                                    <TableCell>{dealer.address}</TableCell>
                                    <TableCell>{dealer.totalOrders}</TableCell>
                                    <TableCell>${dealer.totalRevenue.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={dealer.active ? 'default' : 'secondary'}>
                                            {dealer.active ? t('active') : t('inactive')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={dealer.active}
                                            onCheckedChange={() => handleStatusChange(dealer.id, dealer.active || false)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">{t('noDealers')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

/*
"dealerManagement": "Dealer Management",
"dealerManagementDesc": "View and manage all registered dealers.",
"dealer": "Dealer",
"location": "Location",
"status": "Status",
"active": "Active",
"inactive": "Inactive",
"noDealers": "No dealers registered yet."
*/
