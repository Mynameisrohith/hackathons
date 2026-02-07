
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

function HeroSection() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background pt-20 pb-12 sm:pt-28 sm:pb-20">
       <div className="absolute top-0 left-0 -z-10 h-full w-full bg-grid-slate-900/[0.04] [mask-image:radial-gradient(100%_50%_at_50%_0%,rgba(255,255,255,0.7)_0,rgba(255,255,255,0)_100%)]"></div>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="max-w-xl text-center md:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {t('heroTitle').replace(t('heroTitleHighlight'), '')} <span className="text-primary">{t('heroTitleHighlight')}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {t('heroSubtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 md:justify-start">
              <Button asChild size="lg" className="gradient-btn shadow-lg">
                <Link href="/products">
                  {t('shopNow')} <ShoppingBag className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#categories">
                  {t('browseCategories')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative flex h-full min-h-[300px] items-center justify-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative mt-12 animate-card-enter rounded-xl shadow-2xl transition-transform duration-300 hover:scale-105" style={{ animationDelay: '0.2s' }}>
                <Image src="https://picsum.photos/seed/101/400/500" alt="Product 1" width={400} height={500} className="aspect-[4/5] rounded-xl object-cover" />
              </div>
              <div className="relative animate-card-enter rounded-xl shadow-2xl transition-transform duration-300 hover:scale-105" style={{ animationDelay: '0.4s' }}>
                <Image src="https://picsum.photos/seed/102/400/500" alt="Product 2" width={400} height={500} className="aspect-[4/5] rounded-xl object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function FeaturedProducts({ products, isLoading }: { products: Product[] | null, isLoading: boolean }) {
  const { t } = useLanguage();
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('featuredProducts')}</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[380px] w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            ))
          ) : products && products.length > 0 ? (
            products.map((product, i) => <ProductCard key={product.id} product={product} delay={i * 100} />)
          ) : (
            <p className='col-span-full text-center text-muted-foreground'>No featured products available.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryPreview({ categories, isLoading }: { categories: Category[] | null, isLoading: boolean }) {
  const { t } = useLanguage();
  return (
    <section id="categories" className="bg-primary/5 py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('shopByCategory')}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          ) : categories && categories.length > 0 ? (
            categories.map((category) => <CategoryCard key={category.id} category={category} />)
          ) : (
            <p className='col-span-full text-center text-muted-foreground'>{t('noCategoriesFound')}</p>
          )}
        </div>
        <div className="mt-12 text-center">
            <Button asChild variant="ghost">
                <Link href="/categories">{t('viewAllCategories')} <ArrowRight className="ml-2 h-4 w-4"/></Link>
            </Button>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('createdAt', 'desc'), limit(4));
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('createdAt', 'desc'), limit(4));
  }, [firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  return (
    <div className="animate-card-enter">
      <HeroSection />
      <FeaturedProducts products={products} isLoading={isLoadingProducts} />
      <CategoryPreview categories={categories} isLoading={isLoadingCategories} />
    </div>
  );
}
