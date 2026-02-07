
"use client";

import React, { useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import { collection, collectionGroup, query } from 'firebase/firestore';
import type { Order, Sale } from '@/lib/types';
import { StatCard } from "@/components/admin/StatCard";
import { DollarSign, Package, AlertTriangle, XCircle, Truck } from "lucide-react";
import { RevenueChart, OrderStatusChart } from "@/components/admin/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

const useDashboardStats = () => {
    const firestore = useFirestore();
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const ordersQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collectionGroup(firestore, 'orders')) : null, [firestore, isAdmin]);
    const salesQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collection(firestore, 'sales')) : null, [firestore, isAdmin]);

    const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);
    const { data: sales, isLoading: loadingSales } = useCollection<Sale>(salesQuery);
    
    const isLoading = isAdminLoading || loadingOrders || loadingSales;

    const stats = useMemo(() => {
        if (!orders || !sales) return null;

        const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
        const totalOrders = orders.length;

        const statusCounts = orders.reduce((acc, order) => {
            acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        
        const monthlyRevenue = Array(12).fill(0).map((_, monthIndex) => {
             return orders
                .filter(order => order.createdAt.toDate().getMonth() === monthIndex)
                .reduce((sum, order) => sum + order.totalAmount, 0);
        });

        return {
            totalRevenue,
            totalOrders,
            activeDeliveries: statusCounts['Out for Delivery'] || 0,
            pendingOrders: statusCounts['Pending'] || 0,
            cancelledOrders: statusCounts['Cancelled'] || 0,
            monthlyRevenue,
            orderStatusDistribution: [
                { name: 'Pending', value: statusCounts['Pending'] || 0 },
                { name: 'Packed', value: statusCounts['Packed'] || 0 },
                { name: 'Out for Delivery', value: statusCounts['Out for Delivery'] || 0 },
                { name: 'Delivered', value: statusCounts['Delivered'] || 0 },
                { name: 'Cancelled', value: statusCounts['Cancelled'] || 0 },
            ]
        };
    }, [orders, sales]);

    return { stats, isLoading: isLoading, isAdmin };
};

export default function DashboardPage() {
    const { t } = useLanguage();
    const { stats, isLoading, isAdmin } = useDashboardStats();

    if (isLoading || !isAdmin) {
        return (
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[126px] w-full" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        )
    }

    const statCards = [
        { title: t('totalRevenue'), value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, change: "+20.1%", changeType: 'increase' },
        { title: t('totalOrders'), value: stats?.totalOrders || 0, icon: Package, change: "+180.1%", changeType: 'increase' },
        { title: t('activeDeliveries'), value: stats?.activeDeliveries || 0, icon: Truck, change: "+19%", changeType: 'increase' },
        { title: t('pendingOrders'), value: stats?.pendingOrders || 0, icon: AlertTriangle, change: "-2%", changeType: 'decrease' },
        { title: t('cancelledOrders'), value: stats?.cancelledOrders || 0, icon: XCircle, change: "+5", changeType: 'increase' },
    ];
    
    return (
        <div className="space-y-6">
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                {statCards.map((card, i) => (
                    <StatCard
                        key={card.title}
                        title={card.title}
                        value={card.value.toString()}
                        icon={card.icon}
                        change={card.change}
                        changeType={card.changeType as any}
                        className="animate-card-enter"
                        style={{ animationDelay: `${i*100}ms`}}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 card-glass">
                    <CardHeader>
                        <CardTitle>{t('revenueOverview')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {!stats ? <Skeleton className="h-80 w-full" /> : <RevenueChart data={stats.monthlyRevenue} />}
                    </CardContent>
                </Card>
                 <Card className="card-glass">
                    <CardHeader>
                        <CardTitle>{t('orderStatus')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!stats ? <Skeleton className="h-80 w-full" /> : <OrderStatusChart data={stats.orderStatusDistribution} />}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
