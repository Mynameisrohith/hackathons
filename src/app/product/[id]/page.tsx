
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore, useUser } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import type { Product, Review } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckCircle, XCircle, Plus, Minus, Loader2 } from 'lucide-react';
import { StarRating } from '@/components/StarRating';
import { ProductCard } from '@/components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function ProductDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
        <div>
          <Skeleton className="aspect-square w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-6 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
    const { t } = useLanguage();
    const firestore = useFirestore();

    const reviewsQuery = useMemoFirebase(() => {
        if (!firestore || !productId) return null;
        return query(collection(firestore, 'reviews'), where('productId', '==', productId));
    }, [firestore, productId]);

    const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);

    return (
        <Card className="mt-12">
            <CardHeader>
                <CardTitle>{t('customerReviews')}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : reviews && reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="border-b pb-4 last:border-b-0">
                                <StarRating rating={review.rating} />
                                <p className="mt-2 text-muted-foreground">{review.comment}</p>
                                <p className="mt-2 text-xs text-muted-foreground">{t('byUser').replace('{user}', review.userId.substring(0, 6)).replace('{date}', review.createdAt.toDate().toLocaleDateString())}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">{t('noReviews')}</p>
                )}
            </CardContent>
        </Card>
    )
}

function RelatedProducts({ categoryId, currentProductId }: { categoryId: string, currentProductId: string }) {
    const { t } = useLanguage();
    const firestore = useFirestore();

    const relatedQuery = useMemoFirebase(() => {
        if (!firestore || !categoryId) return null;
        return query(
            collection(firestore, 'products'), 
            where('categoryId', '==', categoryId),
            limit(5) // Get 5, then filter out the current one
        );
    }, [firestore, categoryId]);

    const { data: relatedProducts, isLoading } = useCollection<Product>(relatedQuery);
    
    const filteredProducts = relatedProducts?.filter(p => p.id !== currentProductId).slice(0, 4);

    if (isLoading) {
        return (
             <div className="mt-16">
                <h2 className="text-2xl font-bold tracking-tight mb-6">{t('relatedProducts')}</h2>
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-[380px] w-full" />
                            <Skeleton className="h-5 w-4/5" />
                            <Skeleton className="h-5 w-1/4" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    if (!filteredProducts || filteredProducts.length === 0) return null;

    return (
        <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight mb-6">{t('relatedProducts')}</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
        </div>
    );
}

export default function ProductPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { addToCart, isUpdating } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const productDocRef = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading } = useDoc<Product>(productDocRef);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user) {
        router.push('/login?redirect=/product/' + productId);
        return;
    }
    setIsAdding(true);
    try {
        await addToCart(product, quantity);
        toast({
            title: t('addedToCart'),
            description: t('addedToCartDesc').replace('{qty}', quantity.toString()).replace('{name}', product.name),
        })
    } catch(e) {
        console.error(e);
        toast({
            variant: "destructive",
            title: t('error'),
            description: t('addToCartError'),
        })
    } finally {
        setIsAdding(false);
    }
  }

  const isAddToCartDisabled = isAdding || !product || product.stock === 0 || isUpdating(product.id);

  if (isLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-12 text-center">{t('productNotFound')}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 animate-card-enter">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
        <div className="rounded-xl overflow-hidden shadow-lg">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={800}
            height={800}
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-3xl tracking-tight text-foreground">${product.price.toFixed(2)}</p>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div
              className="space-y-6 text-base text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          <div className="mt-6">
            {product.stock > 0 ? (
                <Badge className='bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'>
                    <CheckCircle className="mr-2 h-4 w-4"/> {t('inStock').replace('{count}', product.stock.toString())}
                </Badge>
            ) : (
                <Badge variant="destructive">
                    <XCircle className="mr-2 h-4 w-4"/> {t('outOfStock')}
                </Badge>
            )}
          </div>
          
          <div className="mt-10 flex items-center gap-4">
             <div className="flex items-center">
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q-1))} disabled={isAddToCartDisabled}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-16 text-center font-bold">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={isAddToCartDisabled}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" className="w-full max-w-xs gradient-btn shadow-lg" disabled={isAddToCartDisabled} onClick={handleAddToCart}>
                {isAdding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
                {t('addToCart')}
            </Button>
          </div>
        </div>
      </div>
      <ReviewsSection productId={product.id} />
      <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />
    </div>
  );
}
