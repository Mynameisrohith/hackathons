
"use client";

import React, { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function NewArrivalsPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return query(
      collection(firestore, 'products'),
      where('createdAt', '>=', sevenDaysAgo),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  return (
    <div className="animate-card-enter">
      <PageHeader
        title={t('newArrivalsTitle')}
        subtitle={t('newArrivalsSubtitle')}
      />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[380px] w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            ))
          ) : products && products.length > 0 ? (
            products.map((product, i) => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} delay={i * 50} />
                <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                  {t('justLaunched')}
                </Badge>
              </div>
            ))
          ) : (
            <p className='col-span-full text-center text-muted-foreground'>{t('noProductsFound').replace('{query}', 'new')}</p>
          )}
        </div>
      </main>
    </div>
  );
}
