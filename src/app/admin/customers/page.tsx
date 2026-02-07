
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query } from 'firebase/firestore';
import type { Order, UserProfile } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon } from 'lucide-react';

interface CustomerStat extends UserProfile {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
}

export default function AdminCustomersPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);

    const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
    const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);

    const customerStats: CustomerStat[] | null = useMemo(() => {
        if (!users || !orders) return null;

        const orderMap = new Map<string, Order[]>();
        orders.forEach(order => {
            if (!orderMap.has(order.userId)) {
                orderMap.set(order.userId, []);
            }
            orderMap.get(order.userId)!.push(order);
        });

        return users.map(user => {
            const userOrders = orderMap.get(user.id) || [];
            const totalOrders = userOrders.length;
            const totalSpent = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
            return {
                ...user,
                totalOrders,
                totalSpent,
                avgOrderValue,
            };
        }).sort((a,b) => b.totalSpent - a.totalSpent);
    }, [users, orders]);

    const isLoading = loadingUsers || loadingOrders;

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
                                                <AvatarImage src={customer.photoURL} alt={customer.displayName} />
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

/*
"customers": "Customers",
"customersDesc": "View and manage your customer data.",
"customer": "Customer",
"totalOrders": "Total Orders",
"totalSpent": "Total Spent",
"avgOrderValue": "Avg. Order Value",
"noCustomers": "No customer data available."
*/
