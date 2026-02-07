
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { collectionGroup, query } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon } from 'lucide-react';

interface CustomerStat {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
}

export default function AdminCustomersPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const ordersQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collectionGroup(firestore, 'orders')) : null, [firestore, isAdmin]);
    const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);

    const customerStats: CustomerStat[] | null = useMemo(() => {
        if (!orders) return null;

        const statsMap = new Map<string, {
            userId: string;
            displayName: string;
            email: string;
            totalOrders: number;
            totalSpent: number;
        }>();

        for (const order of orders) {
            let userStat = statsMap.get(order.userId);
            if (!userStat) {
                userStat = {
                    userId: order.userId,
                    displayName: order.customerName,
                    email: order.userEmail,
                    totalOrders: 0,
                    totalSpent: 0,
                };
            }
            userStat.totalOrders += 1;
            userStat.totalSpent += order.totalAmount;
            statsMap.set(order.userId, userStat);
        }

        return Array.from(statsMap.values()).map(stat => ({
            id: stat.userId,
            displayName: stat.displayName,
            email: stat.email,
            totalOrders: stat.totalOrders,
            totalSpent: stat.totalSpent,
            avgOrderValue: stat.totalOrders > 0 ? stat.totalSpent / stat.totalOrders : 0,
        })).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [orders]);

    const isLoading = isAdminLoading || loadingOrders;

    return (
        <Card className="card-glass">
            <CardHeader>
                <CardTitle>{t('customers')}</CardTitle>
                <CardDescription>{t('customersDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('customer')}</TableHead>
                            <TableHead>{t('totalOrders')}</TableHead>
                            <TableHead>{t('totalSpent')}</TableHead>
                            <TableHead>{t('avgOrderValue')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-32" /></div></TableCell>
                                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                </TableRow>
                            ))
                        ) : customerStats && customerStats.length > 0 ? (
                            customerStats.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {customer.displayName ? customer.displayName.charAt(0).toUpperCase() : <UserIcon />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{customer.displayName}</p>
                                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{customer.totalOrders}</TableCell>
                                    <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                                    <TableCell>${customer.avgOrderValue.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">{t('noCustomers')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
