'use client';

import React, { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, Product, ProductAnalysis, MarketAnalysis } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { analyzeInventory } from '@/lib/inventory-analysis';
import { AnalyticsCard } from '@/components/admin/AnalyticsCard';
import { TrendingUp, TrendingDown, Package, AlertTriangle, ChevronsRight, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';

const riskColors = {
  High: 'text-red-500 border-red-500/30 bg-red-500/10',
  Medium: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  Low: 'text-green-500 border-green-500/30 bg-green-500/10',
  'N/A': 'text-gray-500 border-gray-500/30 bg-gray-500/10',
};

export default function InventoryPage() {
  const firestore = useFirestore();
  const { t } = useLanguage();

  const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products')) : null, [firestore]);
  const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);
  
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);
  const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);

  const isLoading = loadingProducts || loadingOrders;

  const analysis = useMemo(() => {
    if (isLoading || !products || !orders) return null;
    return analyzeInventory(products, orders);
  }, [isLoading, products, orders]);

  if (isLoading || !analysis) {
    return (
      <div className="animate-card-enter">
        <PageHeader title="Smart Inventory" subtitle="AI-powered insights to optimize your stock." />
        <main className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                 {[...Array(3)].map((_,i) => <Skeleton key={i} className="h-40" />)}
            </div>
             <div className="grid gap-8 md:grid-cols-2">
                 {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-60" />)}
            </div>
        </main>
      </div>
    )
  }

  if (!products?.length || !orders?.length) {
    return (
      <div className="animate-card-enter">
        <PageHeader title="Smart Inventory" subtitle="AI-powered insights to optimize your stock." />
        <main className="p-4 sm:p-6 lg:p-8 text-center">
          <h3 className="text-lg font-semibold">{t('welcomeAdmin')}</h3>
          <p className="text-muted-foreground mt-2">{t('welcomeAdminSubtitle')}</p>
           <a href="/admin/products?new=true">
            <Button className="mt-4">{t('addProduct')}</Button>
          </a>
        </main>
      </div>
    );
  }

  const { marketAnalysis, risingProducts, decliningProducts, atRiskProducts, restockSuggestions, overstockedProducts } = analysis;

  return (
    <div className="animate-card-enter">
      <PageHeader title="Smart Inventory" subtitle="AI-powered insights to optimize your stock." />
      <main className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <AnalyticsCard
            title={t('businessHealth')}
            metric={`${(marketAnalysis.weeklyGrowth * 100).toFixed(1)}%`}
            footer={t('vsLast7Days')}
            icon={marketAnalysis.weeklyGrowth > 0 ? TrendingUp : TrendingDown}
            iconClass={marketAnalysis.weeklyGrowth > 0 ? "text-green-500" : "text-red-500"}
          />
          <AnalyticsCard
            title={t('marketTrends')}
            metric={marketAnalysis.volatility}
            footer={marketAnalysis.businessImpactLabel}
            icon={ChevronsRight}
            iconClass={marketAnalysis.volatility === 'Volatile' ? 'text-red-500' : 'text-gray-500'}
          />
          <AnalyticsCard
            title={t('inventoryAtRisk')}
            metric={atRiskProducts.length.toString()}
            footer={`${atRiskProducts.filter(p => p.riskLevel === 'High').length} products at high risk`}
            icon={AlertTriangle}
            iconClass={atRiskProducts.length > 0 ? "text-red-500" : "text-green-500"}
          />
        </div>
        <div className="grid gap-8 md:grid-cols-2">
            <AnalyticsCard title={t('risingProducts')} icon={TrendingUp}>
                {risingProducts.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                        {risingProducts.slice(0, 5).map(p => (
                            <li key={p.id} className="flex justify-between items-center">
                                <span>{p.name}</span>
                                <Badge variant="outline" className="text-green-500 border-green-500/30">+{ (p.trendInfo.momentumScore * 100).toFixed(0) }%</Badge>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground text-center py-4">{t('noRisingTrends')}</p>}
            </AnalyticsCard>

            <AnalyticsCard title={t('decliningProducts')} icon={TrendingDown}>
                {decliningProducts.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                        {decliningProducts.slice(0, 5).map(p => (
                            <li key={p.id} className="flex justify-between items-center">
                                <span>{p.name}</span>
                                 <Badge variant="outline" className="text-red-500 border-red-500/30">{ (p.trendInfo.momentumScore * 100).toFixed(0) }%</Badge>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground text-center py-4">{t('noDeclining')}</p>}
            </AnalyticsCard>

             <AnalyticsCard title={t('restockSuggestions')} icon={Package}>
                {restockSuggestions.length > 0 ? (
                     <ul className="space-y-3 text-sm">
                        {restockSuggestions.slice(0, 5).map(p => (
                            <li key={p.id} className="grid grid-cols-3 items-center gap-2">
                                <span className="font-medium truncate">{p.name}</span>
                                <div className='text-center'>
                                     <Badge className={cn(riskColors[p.riskLevel])}>
                                        {p.daysUntilStockout > 0 ? t('daysLeft').replace('{days}', p.daysUntilStockout.toFixed(0)) : t('dayLeft')}
                                    </Badge>
                                </div>
                               <div className="text-right">
                                <span className="text-muted-foreground">{t('current').replace('{stock}', p.stock.toString())}</span>
                                <span className="font-semibold text-primary"> &rarr; {p.suggestedRestock} {t('units')}</span>
                               </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground text-center py-4">{t('noRestock')}</p>}
            </AnalyticsCard>

             <AnalyticsCard title={t('overstockWarnings')} icon={Warehouse}>
                {overstockedProducts.length > 0 ? (
                     <ul className="space-y-2 text-sm">
                        {overstockedProducts.slice(0, 5).map(p => (
                            <li key={p.id} className="flex justify-between items-center">
                                <span>{p.name}</span>
                                <Badge variant="outline">{t('current').replace('{stock}', p.stock.toString())}</Badge>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground text-center py-4">{t('noOverstock')}</p>}
            </AnalyticsCard>
        </div>
      </main>
    </div>
  );
}
