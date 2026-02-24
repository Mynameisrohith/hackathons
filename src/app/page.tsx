
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
  stores: Store[] | null,
  reviews: Review[] | null
) {
   if (!stores || !reviews) {
      return { activeDealers: 0, fraudAlerts: 0 };
  }
  
  // Active Dealers
  const activeDealers = stores.filter(s => s.active === true).length;

  // Fraud Alerts (Proxy: count reviews with a rating of 1)
  const fraudAlerts = reviews.filter(r => r.rating === 1).length;

  return { activeDealers, fraudAlerts };
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

  const storesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stores')) : null, [firestore]);
  const reviewsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'reviews')) : null, [firestore]);

  const { data: stores, isLoading: loadingStores } = useCollection<Store>(storesQuery);
  const { data: reviews, isLoading: loadingReviews } = useCollection<Review>(reviewsQuery);

  const metrics = useMemo(() => calculateMetrics(stores, reviews), [stores, reviews]);
  const isLoading = loadingStores || loadingReviews;

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
