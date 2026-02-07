
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

function CartItemRow({ item }: { item: any }) {
  const { t } = useLanguage();
  const { updateQuantity, removeFromCart, isUpdating } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(item.id);
    } else if (newQuantity > item.stock) {
      toast({
        variant: 'destructive',
        title: t('stockError'),
        description: t('stockErrorDesc').replace('{stock}', item.stock.toString()).replace('{name}', item.productName),
      });
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="grid grid-cols-12 items-center gap-4 border-b py-4">
      <div className="col-span-2">
        <Image
          src={item.imageUrl}
          alt={item.productName}
          width={80}
          height={80}
          className="rounded-md object-cover"
        />
      </div>
      <div className="col-span-4">
        <h3 className="font-medium">{item.productName}</h3>
        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
      </div>
      <div className="col-span-3 flex items-center justify-center">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isUpdating(item.id)}
        >
          {isUpdating(item.id) ? <Loader2 className="animate-spin" /> : <Minus className="h-4 w-4" />}
        </Button>
        <Input
          type="number"
          className="mx-2 h-8 w-14 text-center"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
          max={item.stock}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isUpdating(item.id)}
        >
          {isUpdating(item.id) ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
      <div className="col-span-2 text-right font-medium">
        ${(item.price * item.quantity).toFixed(2)}
      </div>
      <div className="col-span-1 text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeFromCart(item.id)}
          disabled={isUpdating(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CartSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-4 border-b py-4">
                    <div className="col-span-2"><Skeleton className="h-20 w-20 rounded-md" /></div>
                    <div className="col-span-4 space-y-2">
                        <Skeleton className="h-5 w-4/5" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                    <div className="col-span-3 flex items-center justify-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-14 mx-2" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="col-span-2 text-right"><Skeleton className="h-5 w-16 ml-auto" /></div>
                    <div className="col-span-1 text-right"><Skeleton className="h-8 w-8 ml-auto" /></div>
                </div>
            ))}
        </div>
    )
}

function EmptyCart() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-background/50 p-12 text-center">
      <ShoppingCart className="h-16 w-16 text-muted-foreground" />
      <h2 className="mt-6 text-2xl font-semibold">{t('emptyCartTitle')}</h2>
      <p className="mt-2 text-muted-foreground">{t('emptyCartDesc')}</p>
      <Button asChild className="mt-6">
        <Link href="/products">{t('continueShopping')}</Link>
      </Button>
    </div>
  );
}

export default function CartPage() {
  const { items, cartTotal, isLoading, cartCount } = useCart();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-center text-4xl font-extrabold tracking-tight">{t('yourShoppingCart')}</h1>

      {isLoading && <CartSkeleton />}

      {!isLoading && (!items || items.length === 0) && <EmptyCart />}

      {!isLoading && items && items.length > 0 && (
        <div className="grid grid-cols-1 gap-12">
          <div>
            <div className="grid grid-cols-12 gap-4 border-b pb-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-6">{t('product')}</div>
              <div className="col-span-3 text-center">{t('quantity')}</div>
              <div className="col-span-2 text-right">{t('total')}</div>
              <div className="col-span-1" />
            </div>
            <div>
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('shipping')}</span>
                <span>{t('calculatedAtCheckout')}</span>
              </div>
              <div className="flex justify-between border-t pt-4 text-lg font-bold">
                <span>{t('grandTotal')}</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <Button
                size="lg"
                className="w-full gradient-btn"
                onClick={() => router.push('/checkout')}
              >
                {t('proceedToCheckout')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
