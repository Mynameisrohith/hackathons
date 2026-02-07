
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { collection, query } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon } from 'lucide-react';

interface CustomerStat extends UserProfile {
    totalOrders: number;
    totalSpent: number;
}

const useCustomerData = () => {
    const firestore = useFirestore();
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const usersQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collection(firestore, 'users')) : null, [firestore, isAdmin]);
    const ordersQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collection(firestore, 'orders')) : null, [firestore, isAdmin]);

    const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
    const { data: orders, isLoading: loadingOrders } = useCollection<any>(ordersQuery);

    const customerStats: CustomerStat[] | null = useMemo(() => {
        if (!users || !orders) return null;

        return users.map(user => {
            const userOrders = orders.filter(order => order.userId === user.id);
            const totalOrders = userOrders.length;
            const totalSpent = userOrders.reduce((acc, order) => acc + order.totalAmount, 0);
            return {
                ...user,
                totalOrders,
                totalSpent,
            };
        }).sort((a,b) => b.totalSpent - a.totalSpent);
    }, [users, orders]);
    
    const isLoading = isAdminLoading || loadingUsers || loadingOrders;

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
                                                <AvatarImage src={customer.photoURL || ''} alt={customer.displayName} />
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
