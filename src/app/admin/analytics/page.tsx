'use client';

import React, { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, Product, Category } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart, CategoryDistributionChart, SalesByCityChart } from '@/components/admin/charts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function calculateAnalytics(orders: Order[] | null, products: Product[] | null, categories: Category[] | null) {
  if (!orders || !products || !categories) {
    return {
      revenueData: Array(12).fill(0),
      categoryDistribution: [],
      salesByCity: {},
      topProducts: [],
    };
  }

  const revenueData = Array(12).fill(0);
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const categorySales = new Map<string, number>();
  const salesByCity = new Map<string, number>();
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const order of orders) {
    if (order.orderStatus !== 'Cancelled') {
      const orderMonth = new Date(order.createdAt.seconds * 1000).getMonth();
      revenueData[orderMonth] += order.totalAmount;
      
      salesByCity.set(order.city, (salesByCity.get(order.city) || 0) + order.totalAmount);
      
      for (const item of order.items) {
        const product = products.find(p => p.id === item.productId);
        if(product) {
            const categoryName = categoryMap.get(product.categoryId) || 'Unknown';
            categorySales.set(categoryName, (categorySales.get(categoryName) || 0) + item.price * item.quantity);

            const currentSales = productSales.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
            currentSales.quantity += item.quantity;
            currentSales.revenue += item.price * item.quantity;
            productSales.set(item.productId, currentSales);
        }
      }
    }
  }

  const categoryDistribution = Array.from(categorySales.entries()).map(([name, value]) => ({ name, value }));
  const topProducts = Array.from(productSales.values()).sort((a,b) => b.revenue - a.revenue).slice(0, 5);

  return { revenueData, categoryDistribution, salesByCity: Object.fromEntries(salesByCity), topProducts };
}

export default function AnalyticsPage() {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);
  const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products')) : null, [firestore]);
  const categoriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'categories')) : null, [firestore]);

  const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);
  
  const isLoading = loadingOrders || loadingProducts || loadingCategories;
  const analytics = useMemo(() => calculateAnalytics(orders, products, categories), [orders, products, categories]);

  return (
    <div className="animate-card-enter">
      <PageHeader title="Analytics" subtitle="Deep dive into your sales and product performance." />
      <main className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3 card-glass">
            <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[250px] w-full" /> : <RevenueChart data={analytics.revenueData} />}
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardHeader><CardTitle>Category Distribution</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[250px] w-full" /> : <CategoryDistributionChart data={analytics.categoryDistribution} />}
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardHeader><CardTitle>Sales by City</CardTitle></CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-[250px] w-full" /> : <SalesByCityChart data={analytics.salesByCity} />}
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 card-glass">
            <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topProducts.map(p => (
                      <TableRow key={p.name}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell className="text-right">{p.quantity}</TableCell>
                        <TableCell className="text-right">${p.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
