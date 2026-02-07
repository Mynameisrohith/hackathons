
"use client";

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { collection, collectionGroup, query, where } from 'firebase/firestore';
import type { Order, Product, Sale, Review } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RevenueChart, CategoryDistributionChart, SalesByCityChart } from '@/components/admin/charts';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StarRating } from '@/components/StarRating';

const useAnalyticsData = () => {
    const firestore = useFirestore();
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const ordersQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collectionGroup(firestore, 'orders')) : null, [firestore, isAdmin]);
    const productsQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collection(firestore, 'products')) : null, [firestore, isAdmin]);
    const categoriesQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collection(firestore, 'categories')) : null, [firestore, isAdmin]);
    const reviewsQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collection(firestore, 'reviews')) : null, [firestore, isAdmin]);
    
    const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);
    const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);
    const { data: categories, isLoading: loadingCategories } = useCollection<any>(categoriesQuery);
    const { data: reviews, isLoading: loadingReviews } = useCollection<Review>(reviewsQuery);

    const isLoading = isAdminLoading || loadingOrders || loadingProducts || loadingCategories || loadingReviews;

    const analytics = useMemo(() => {
        if (isLoading || !orders || !products || !categories) return null;

        const monthlyRevenue = Array(12).fill(0);
        orders.forEach(order => {
            const month = order.createdAt.toDate().getMonth();
            monthlyRevenue[month] += order.totalAmount;
        });

        const categoryCounts: { [key: string]: number } = {};
        products.forEach(product => {
            categoryCounts[product.categoryId] = (categoryCounts[product.categoryId] || 0) + 1;
        });

        const categoryDistribution = categories.map(cat => ({
            name: cat.name,
            value: categoryCounts[cat.id] || 0,
        }));

        const salesByCity = orders.reduce((acc, order) => {
            const city = order.city || 'Unknown';
            acc[city] = (acc[city] || 0) + order.totalAmount;
            return acc;
        }, {} as { [key: string]: number });
        
        const topProducts = [...products]
            .sort((a, b) => b.stock - a.stock) // As a proxy for sales for now
            .slice(0, 5)
            .map(p => ({...p, sales: orders.filter(o => o.items.some(i => i.productId === p.id)).length }));

        const recentReviews = [...(reviews || [])]
            .sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
            .slice(0, 5);
            

        return { monthlyRevenue, categoryDistribution, salesByCity, topProducts, recentReviews };

    }, [orders, products, categories, reviews, isLoading]);

    return { analytics, isLoading };
}


export default function AnalyticsPage() {
    const { t } = useLanguage();
    const { analytics, isLoading } = useAnalyticsData();
    
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2 card-glass">
                    <CardHeader>
                        <CardTitle>{t('monthlyRevenue')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading || !analytics ? <Skeleton className="h-72 w-full" /> : <RevenueChart data={analytics.monthlyRevenue} />}
                    </CardContent>
                </Card>
                <Card className="card-glass">
                    <CardHeader>
                        <CardTitle>{t('categoryDistribution')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {isLoading || !analytics ? <Skeleton className="h-72 w-full" /> : <CategoryDistributionChart data={analytics.categoryDistribution} />}
                    </CardContent>
                </Card>
            </div>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1 card-glass">
                    <CardHeader>
                        <CardTitle>{t('topProducts')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {isLoading || !analytics ? <Skeleton className="h-96 w-full" /> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('productName')}</TableHead>
                                        <TableHead>{t('sales')}</TableHead>
                                        <TableHead>{t('stock')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.topProducts.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell>{p.sales}</TableCell>
                                            <TableCell>{p.stock}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                       )}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 card-glass">
                    <CardHeader>
                        <CardTitle>{t('recentFeedback')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading || !analytics ? <Skeleton className="h-96 w-full" /> : analytics.recentReviews.length > 0 ? (
                            analytics.recentReviews.map(r => (
                                <div key={r.id} className="border-b pb-2">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{r.productName}</p>
                                        <StarRating rating={r.rating} />
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>
                                </div>
                            ))
                        ) : <p className="text-center text-muted-foreground py-10">{t('noFeedback')}</p>}
                    </CardContent>
                </Card>
             </div>
        </div>
    );
}

// Add new translation keys
/*
"monthlyRevenue": "Monthly Revenue",
"categoryDistribution": "Category Distribution",
"salesByCity": "Sales by City",
"topProducts": "Top Selling Products",
"recentFeedback": "Recent Feedback",
"noFeedback": "No feedback submitted yet."
*/
