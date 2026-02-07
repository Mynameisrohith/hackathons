
"use client";

import React from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Category } from '@/lib/types';
import { CategoryCard } from '@/components/CategoryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{t('allCategories')}</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          {t('categoriesSubtitle')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : categories && categories.length > 0 ? (
          categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))
        ) : (
          <p className='col-span-full text-center text-muted-foreground'>{t('noCategoriesFound')}</p>
        )}
      </div>
    </div>
  );
}
