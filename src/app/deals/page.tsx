
"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { ProductCard } from '@/components/ProductCard';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date("2025-01-01") - +new Date();
            let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return timeLeft;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex justify-center gap-4 text-center">
            {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="p-4 bg-background/50 rounded-lg w-24">
                    <div className="text-4xl font-bold">{value}</div>
                    <div className="text-sm uppercase text-muted-foreground">{unit}</div>
                </div>
            ))}
        </div>
    );
};


export default function DealsPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('price', 'asc'), limit(8));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  return (
    <div className="animate-card-enter">
      <PageHeader
        title={t('dealsTitle')}
        subtitle={t('dealsSubtitle')}
      />
      
      <section className="py-12 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Flash Sale Ending Soon!</h2>
            <CountdownTimer />
        </div>
      </section>
      
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
                 <div className="absolute top-4 left-4">
                  <span className="text-lg font-semibold text-destructive line-through">${(product.price * 1.2).toFixed(2)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className='col-span-full text-center text-muted-foreground'>No deals available right now.</p>
          )}
        </div>
      </main>
    </div>
  );
}
