"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Sale } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-6" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const RevenueChart = ({
  data,
  isLoading,
}: {
  data: any[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Revenue - Last 7 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "sales"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const salesData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Sale)
        );
        setSales(salesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching sales:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const analytics = useMemo(() => {
    if (sales.length === 0) {
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        topSellingProduct: "N/A",
        worstSellingProduct: "N/A",
        last7DaysRevenue: 0,
        revenueByDay: [],
      };
    }

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTransactions = sales.length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7DaysSales = sales.filter(
      (sale) => sale.createdAt.toDate() > sevenDaysAgo
    );
    const last7DaysRevenue = last7DaysSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const productSales = sales.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    const sortedProducts = Object.entries(productSales).sort(
      ([, a], [, b]) => b - a
    );
    const topSellingProduct =
      sortedProducts.length > 0 ? sortedProducts[0][0] : "N/A";
    const worstSellingProduct =
      sortedProducts.length > 0
        ? sortedProducts[sortedProducts.length - 1][0]
        : "N/A";

    const revenueByDay = last7DaysSales.reduce((acc, sale) => {
        const date = sale.createdAt.toDate().toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + sale.totalAmount;
        return acc;
      }, {} as Record<string, number>);

    const chartData = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return {
      totalRevenue,
      totalTransactions,
      topSellingProduct,
      worstSellingProduct,
      last7DaysRevenue,
      revenueByDay: chartData,
    };
  }, [sales]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={`$${analytics.totalRevenue.toFixed(2)}`}
        icon={DollarSign}
        isLoading={isLoading}
      />
      <StatCard
        title="Total Transactions"
        value={`${analytics.totalTransactions}`}
        icon={ShoppingCart}
        isLoading={isLoading}
      />
      <StatCard
        title="Top Selling Product"
        value={analytics.topSellingProduct}
        icon={ArrowUpRight}
        isLoading={isLoading}
      />
      <StatCard
        title="Revenue (Last 7 Days)"
        value={`$${analytics.last7DaysRevenue.toFixed(2)}`}
        icon={TrendingUp}
        isLoading={isLoading}
      />
       <RevenueChart data={analytics.revenueByDay} isLoading={isLoading} />
    </div>
  );
}
