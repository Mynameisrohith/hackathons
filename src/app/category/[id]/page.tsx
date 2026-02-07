
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const firestore = useFirestore();

  const categoryDocRef = useMemoFirebase(() => {
    if (!firestore || !categoryId) return null;
    return doc(firestore, 'categories', categoryId);
  }, [firestore, categoryId]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !categoryId) return null;
    return query(collection(firestore, 'products'), where('categoryId', '==', categoryId));
  }, [firestore, categoryId]);

  const { data: category, isLoading: isLoadingCategory } = useDoc<Category>(categoryDocRef);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const isLoading = isLoadingCategory || isLoadingProducts;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-12">
        {isLoadingCategory || !category ? (
          <>
            <Skeleton className='h-12 w-64 mx-auto' />
            <Skeleton className='h-6 w-96 mx-auto mt-4' />
          </>
        ) : (
          <>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{category.name}</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              {category.description}
            </p>
          </>
        )}
      </div>

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
          products.map((product, i) => <ProductCard key={product.id} product={product} delay={i * 50} />)
        ) : (
          <p className='col-span-full text-center text-muted-foreground'>No products found in this category.</p>
        )}
      </div>
    </div>
  );
}
