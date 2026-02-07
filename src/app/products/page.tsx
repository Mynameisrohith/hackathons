
"use client";

import React, { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useDebounce } from '@/hooks/use-debounce';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from '@/components/SearchBar';

export default function ProductsPage() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [products, debouncedSearchQuery]);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mb-12">
        <div className='max-w-2xl mx-auto'>
            <h1 className="text-center text-4xl font-extrabold tracking-tight lg:text-5xl">Our Products</h1>
            <p className="mt-4 text-center text-lg text-muted-foreground">
                Find what you're looking for with our instant search.
            </p>
            <div className='mt-6'>
                <SearchBar />
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[380px] w-full" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-5 w-1/4" />
            </div>
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product, i) => <ProductCard key={product.id} product={product} delay={i * 50} />)
        ) : (
          <p className='col-span-full text-center text-muted-foreground'>No products found for "{debouncedSearchQuery}".</p>
        )}
      </div>
    </div>
  );
}
