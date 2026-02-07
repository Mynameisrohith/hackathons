
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { collectionGroup, query } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon } from 'lucide-react';

// This will be a derived interface, not extending UserProfile directly
interface CustomerStat {
    id: string; // userId
    displayName: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    // photoURL is removed
}

const useCustomerData = () => {
    const firestore = useFirestore();
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const ordersQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collectionGroup(firestore, 'orders')) : null, [firestore, isAdmin]);
    const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);

    const customerStats: CustomerStat[] | null = useMemo(() => {
        if (!orders) return null;

        const customerMap = new Map<string, {
            id: string;
            displayName: string;
            email: string;
            totalOrders: number;
            totalSpent: number;
        }>();

        orders.forEach(order => {
            if (!customerMap.has(order.userId)) {
                customerMap.set(order.userId, {
                    id: order.userId,
                    displayName: order.customerName,
                    email: order.userEmail,
                    totalOrders: 0,
                    totalSpent: 0,
                });
            }

            const customer = customerMap.get(order.userId)!;
            customer.totalOrders += 1;
            customer.totalSpent += order.totalAmount;
        });

        return Array.from(customerMap.values()).sort((a,b) => b.totalSpent - a.totalSpent);
    }, [orders]);
    
    const isLoading = isAdminLoading || loadingOrders;

    return { customerStats, isLoading, isAdmin };
};

export default function AdminCustomersPage() {
    const { t } = useLanguage();
    const { customerStats, isLoading, isAdmin } = useCustomerData();

    if (isLoading || !isAdmin) {
        return (
             <Card className="card-glass">
                <CardHeader>
                    <CardTitle>{t('customers')}</CardTitle>
                    <CardDescription>{t('customersDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                           <div key={i} className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-32" /></div>
                                <Skeleton className="h-5 w-12" />
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-20" />
                           </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customerStats && customerStats.length > 0 ? (
                            customerStats.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                {/* No photoURL available */}
                                                <AvatarImage src={''} alt={customer.displayName} />
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
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">{t('noCustomers')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
