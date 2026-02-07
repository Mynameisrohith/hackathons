'use client';

import React, { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { DollarSign, Package, Truck, Ban, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RevenueChart, OrderStatusChart } from '@/components/admin/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function calculateDashboardStats(orders: Order[] | null) {
    if (!orders) {
        return {
            totalRevenue: 0,
            totalOrders: 0,
            activeDeliveries: 0,
            pendingOrders: 0,
            cancelledOrders: 0,
            avgDeliveryTime: 0,
            revenueData: Array(12).fill(0),
            orderStatusData: [],
        };
    }

    const stats = orders.reduce((acc, order) => {
        const orderMonth = order.createdAt ? new Date(order.createdAt.seconds * 1000).getMonth() : new Date().getMonth();
        
        if (order.orderStatus !== 'Cancelled') {
            acc.totalRevenue += order.totalAmount;
            acc.revenueData[orderMonth] += order.totalAmount;
        }

        acc.totalOrders += 1;
        if (order.orderStatus === 'Out for Delivery') acc.activeDeliveries += 1;
        if (order.orderStatus === 'Pending') acc.pendingOrders += 1;
        if (order.orderStatus === 'Cancelled') acc.cancelledOrders += 1;

        const status = order.orderStatus;
        if (!acc.orderStatusMap[status]) {
            acc.orderStatusMap[status] = 0;
        }
        acc.orderStatusMap[status]++;

        return acc;
    }, {
        totalRevenue: 0,
        totalOrders: 0,
        activeDeliveries: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        revenueData: Array(12).fill(0),
        orderStatusMap: {} as { [key: string]: number },
    });
    
    const orderStatusData = Object.entries(stats.orderStatusMap).map(([name, value]) => ({ name, value }));

    return { ...stats, orderStatusData };
}

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Safe collection group query
    return query(collectionGroup(firestore, 'orders'));
  }, [firestore]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const stats = useMemo(() => calculateDashboardStats(orders), [orders]);

  return (
    <div className="animate-card-enter">
      <PageHeader title="Admin Dashboard" subtitle="Welcome to your Enterprise Control Center." />
      <main className="p-4 sm:p-6 lg:p-8 space-y-8">
        {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[126px]" />)}
            </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} />
                <StatCard title="Total Orders" value={stats.totalOrders.toString()} icon={Package} />
                <StatCard title="Active Deliveries" value={stats.activeDeliveries.toString()} icon={Truck} />
                <StatCard title="Pending Orders" value={stats.pendingOrders.toString()} icon={Clock} />
                <StatCard title="Cancelled Orders" value={stats.cancelledOrders.toString()} icon={Ban} />
            </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4 card-glass">
                 <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
                 <CardContent>
                    {isLoading ? <Skeleton className="h-[250px] w-full" /> : <RevenueChart data={stats.revenueData} />}
                 </CardContent>
            </Card>
             <Card className="lg:col-span-3 card-glass">
                <CardHeader><CardTitle>Order Status Distribution</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-[250px] w-full" /> : <OrderStatusChart data={stats.orderStatusData} />}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
