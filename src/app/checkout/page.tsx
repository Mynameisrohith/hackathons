
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/context/CartContext';
import { useUser, useFirestore } from '@/firebase';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, ArrowRight, ArrowLeft, Check, CreditCard, Landmark, CircleDollarSign } from 'lucide-react';
import type { Order, CartItem } from '@/lib/types';
import Image from 'next/image';
import { Label } from '@/components/ui/label';

const addressSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Must be a 10-digit phone number'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a 6-digit pincode'),
});

type CheckoutStep = 'address' | 'payment';

export default function CheckoutPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { items, cartTotal, clearCart, isLoading: isCartLoading } = useCart();
  const { user } = useUser();
  const firestore = useFirestore();

  const [step, setStep] = useState<CheckoutStep>('address');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Card' | 'UPI'>('COD');
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      customerName: user?.displayName || '',
      phone: '',
      address: '',
      city: '',
      pincode: '',
    },
  });

  useEffect(() => {
    if (!isCartLoading && (!items || items.length === 0)) {
      toast({ title: t('emptyCartTitle'), description: t('emptyCartRedirect'), variant: 'destructive' });
      router.replace('/cart');
    }
  }, [items, isCartLoading, router, t]);

  const processAddress = (data: z.infer<typeof addressSchema>) => {
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (!user || !firestore || !items) return;
    setIsProcessing(true);

    const addressData = form.getValues();
    const orderItems: Omit<CartItem, 'id' | 'createdAt' | 'stock'>[] = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    }));

    const newOrder: Omit<Order, 'id'> = {
      userId: user.uid,
      items: orderItems,
      totalAmount: cartTotal,
      ...addressData,
      paymentMethod,
      paymentStatus: 'Pending',
      createdAt: serverTimestamp() as any,
    };

    try {
      const batch = writeBatch(firestore);
      const orderRef = doc(collection(firestore, 'users', user.uid, 'orders'));
      batch.set(orderRef, newOrder);

      // Clear cart
      for (const item of items) {
        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.id);
        batch.delete(cartItemRef);
      }
      
      await batch.commit();
      
      // No non-blocking updates here since we need to wait for order confirmation
      // clearCart function in context also clears local state
      clearCart();

      router.push(`/order-success?orderId=${orderRef.id}`);

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: t('orderError'),
        description: t('orderErrorDesc'),
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const Stepper = () => (
    <div className="flex items-center justify-center mb-12">
      <div className="flex items-center">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', step === 'address' ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white')}>
          {step === 'address' ? '1' : <Check className="h-5 w-5" />}
        </div>
        <span className="ml-2 font-medium">{t('shippingAddress')}</span>
      </div>
      <div className="mx-4 h-0.5 flex-1 bg-border" />
      <div className="flex items-center">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          2
        </div>
        <span className={cn('ml-2 font-medium', step === 'address' && 'text-muted-foreground')}>{t('payment')}</span>
      </div>
    </div>
  );

  if (isCartLoading || !items || items.length === 0) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Stepper />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className={cn('transition-opacity duration-500', step === 'payment' && 'hidden md:block')}>
          <h2 className="mb-4 text-xl font-semibold">{t('address')}</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(processAddress)} className="space-y-4">
              <FormField control={form.control} name="customerName" render={({ field }) => (
                <FormItem><FormLabel>{t('fullName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>{t('phone')}</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>{t('address')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>{t('city')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                  <FormItem><FormLabel>{t('pincode')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full">
                {t('continueToPayment')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </div>

        <div className={cn('transition-opacity duration-500', step === 'address' && 'hidden')}>
          <h2 className="mb-4 text-xl font-semibold">{t('paymentMethod')}</h2>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
            <Label htmlFor="cod" className="flex cursor-pointer items-center rounded-lg border p-4 has-[:checked]:border-primary">
              <RadioGroupItem value="COD" id="cod" />
              <div className="ml-4">
                <p className="font-medium">{t('cashOnDelivery')}</p>
                <p className="text-sm text-muted-foreground">{t('cashOnDeliveryDesc')}</p>
              </div>
            </Label>
             <Label htmlFor="card" className="flex cursor-pointer items-center rounded-lg border p-4 has-[:checked]:border-primary">
              <RadioGroupItem value="Card" id="card" />
              <div className="ml-4">
                <p className="font-medium">{t('creditDebitCard')}</p>
                <p className="text-sm text-muted-foreground">{t('creditDebitCardDesc')}</p>
              </div>
            </Label>
             <Label htmlFor="upi" className="flex cursor-pointer items-center rounded-lg border p-4 has-[:checked]:border-primary">
              <RadioGroupItem value="UPI" id="upi" />
              <div className="ml-4">
                <p className="font-medium">{t('upi')}</p>
                <p className="text-sm text-muted-foreground">{t('upiDesc')}</p>
              </div>
            </Label>
          </RadioGroup>
          <div className="mt-8 flex items-center gap-4">
            <Button variant="outline" onClick={() => setStep('address')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('backToAddress')}
            </Button>
            <Button onClick={handlePlaceOrder} disabled={isProcessing} className="w-full">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('placeOrder')} - ${cartTotal.toFixed(2)}
            </Button>
          </div>
        </div>

        <Card className="md:row-start-1 md:col-start-2">
          <CardHeader>
            <CardTitle>{t('orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Image src={item.imageUrl} alt={item.productName} width={48} height={48} className="rounded-md" />
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">{t('quantity')}: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between"><p>{t('subtotal')}</p><p>${cartTotal.toFixed(2)}</p></div>
                <div className="flex justify-between"><p>{t('shipping')}</p><p>{t('free')}</p></div>
                <div className="flex justify-between font-bold text-lg"><p>{t('grandTotal')}</p><p>${cartTotal.toFixed(2)}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
