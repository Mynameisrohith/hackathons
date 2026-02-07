
"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function FilterSidebar() {
    const { t } = useLanguage();
    return (
        <aside className="w-full lg:w-64 xl:w-72 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">{t('filters')}</h3>
            </div>
            
            <div>
                <h4 className="font-medium mb-3">{t('sortBy')}</h4>
                 <Select>
                    <SelectTrigger>
                        <SelectValue placeholder={t('popularity')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="popularity">{t('popularity')}</SelectItem>
                        <SelectItem value="price-low-high">{t('priceLowToHigh')}</SelectItem>
                        <SelectItem value="price-high-low">{t('priceHighToLow')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <h4 className="font-medium mb-3">{t('priceRange')}</h4>
                <Slider defaultValue={[50]} max={100} step={1} />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>$0</span>
                    <span>$1000</span>
                </div>
            </div>

             <div>
                <h4 className="font-medium mb-3">{t('categories')}</h4>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="cat1" />
                        <Label htmlFor="cat1">Electronics</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="cat2" />
                        <Label htmlFor="cat2">Apparel</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="cat3" />
                        <Label htmlFor="cat3">Books</Label>
                    </div>
                </div>
            </div>

        </aside>
    )
}

export default function ShopPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();

   const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  return (
    <div className="animate-card-enter">
      <PageHeader
        title={t('shopPageTitle')}
        subtitle={t('shopPageSubtitle')}
      />
       <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col lg:flex-row gap-12">
                <FilterSidebar />
                <main className="flex-1">
                     <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                        {isLoading ? (
                        Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="space-y-4">
                            <Skeleton className="h-[380px] w-full" />
                            <Skeleton className="h-5 w-4/5" />
                            <Skeleton className="h-5 w-1/4" />
                            </div>
                        ))
                        ) : products && products.length > 0 ? (
                        products.map((product, i) => <ProductCard key={product.id} product={product} delay={i * 50} />)
                        ) : (
                        <p className='col-span-full text-center text-muted-foreground'>{t('noProductsFound').replace('{query}', '')}</p>
                        )}
                    </div>
                </main>
            </div>
       </div>
    </div>
  );
}
