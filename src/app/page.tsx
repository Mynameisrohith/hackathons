
'use client';

import React, { useEffect, useMemo, Suspense } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, Review, Store } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const HeroSection = React.lazy(() => import('@/components/landing/Hero'));
const MetricsSection = React.lazy(() => import('@/components/landing/Metrics'));
const FeaturesSection = React.lazy(() => import('@/components/landing/Features'));
const DashboardPreview = React.lazy(() => import('@/components/landing/DashboardPreview'));
const WorkflowSection = React.lazy(() => import('@/components/landing/Workflow'));
const HeatmapSection = React.lazy(() => import('@/components/landing/Heatmap'));
const TrustSection = React.lazy(() => import('@/components/landing/Trust'));

function calculateMetrics(
  orders: Order[] | null,
  stores: Store[] | null,
  reviews: Review[] | null
) {
   if (!orders || !stores || !reviews) {
      return { totalRevenue: 0, totalOrders: 0, activeDealers: 0, fraudAlerts: 0, avgDeliveryTime: 0 };
  }
  
  // Total Orders
  const totalOrders = orders.length;

  // Active Dealers
  const activeDealers = stores.filter(s => s.active === true).length;

  // Total Revenue (from delivered orders)
  const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered');
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Average Delivery Time (in minutes)
  let totalDeliveryMinutes = 0;
  let deliveredCount = 0;
  deliveredOrders.forEach(order => {
      const createdAt = order.createdAt?.seconds;
      const updatedAt = order.updatedAt?.seconds;
      if (createdAt && updatedAt && updatedAt > createdAt) {
          totalDeliveryMinutes += (updatedAt - createdAt) / 60;
          deliveredCount++;
      }
  });
  const avgDeliveryTime = deliveredCount > 0 ? Math.round(totalDeliveryMinutes / deliveredCount) : 0;

  // Fraud Alerts (Proxy: count reviews with a rating of 1)
  const fraudAlerts = reviews.filter(r => r.rating === 1).length;

  return { totalRevenue, totalOrders, activeDealers, fraudAlerts, avgDeliveryTime };
}

export default function HomePage() {
  const firestore = useFirestore();

  // Set dark theme for the landing page
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);
  const storesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stores')) : null, [firestore]);
  const reviewsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'reviews')) : null, [firestore]);

  const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);
  const { data: stores, isLoading: loadingStores } = useCollection<Store>(storesQuery);
  const { data: reviews, isLoading: loadingReviews } = useCollection<Review>(reviewsQuery);

  const metrics = useMemo(() => calculateMetrics(orders, stores, reviews), [orders, stores, reviews]);
  const isLoading = loadingOrders || loadingStores || loadingReviews;

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      <Suspense fallback={<div className="h-screen w-full bg-background" />}>
        <HeroSection />
      </Suspense>

      <main className="container mx-auto px-4">
        <Suspense fallback={<Skeleton className="h-48 w-full my-24" />}>
          <MetricsSection metrics={metrics} isLoading={isLoading} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-96 w-full my-24" />}>
          <FeaturesSection />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-96 w-full my-24" />}>
          <DashboardPreview />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-64 w-full my-24" />}>
          <WorkflowSection />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-96 w-full my-24" />}>
          <HeatmapSection />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-64 w-full my-24" />}>
          <TrustSection />
        </Suspense>
      </main>
    </div>
  );
}
