
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/context/CartContext';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, ArrowRight, ArrowLeft, Check, AlertTriangle, Truck } from 'lucide-react';
import type { Order, CartItem, Store, Coordinates } from '@/lib/types';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { getHaversineDistance } from '@/lib/geolocation';
import { Skeleton } from '@/components/ui/skeleton';
import { AddressAutocomplete, GeocodedAddress } from '@/components/AddressAutocomplete';

const addressSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Must be a 10-digit phone number'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a 6-digit pincode'),
});

type CheckoutStep = 'address' | 'payment';

type NearestStoreInfo = {
    store: Store;
    distance: number;
    deliveryEstimate: string;
};

function NearestStoreCard({
    storeInfo,
    isLoading
}: {
    storeInfo: NearestStoreInfo | null,
    isLoading: boolean
}) {
    const { t } = useLanguage();
    const [mapVisible, setMapVisible] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>{t('checkingNearbyStores')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                </CardContent>
            </Card>
        )
    }

    if (!storeInfo) {
        return (
            <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={20} /> {t('locationAccessDenied')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{t('locationAccessDeniedDesc')}</p>
                </CardContent>
            </Card>
        )
    }
    
    const { store, distance, deliveryEstimate } = storeInfo;
    return (
        <Card className="animate-card-enter">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck size={22} /> {t('deliveryDetails')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="font-medium">{t('dispatchedFrom')}: <span className="text-primary">{store.name}</span></p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t('distance')}</span>
                    <span className="font-semibold text-foreground">{distance.toFixed(1)} km</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t('estimatedDelivery')}</span>
                    <span className="font-semibold text-foreground">{deliveryEstimate}</span>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2">
                <Button variant="link" className="p-0 h-auto" onClick={() => setMapVisible(!mapVisible)}>
                    {mapVisible ? t('hideMap') : t('showMap')}
                </Button>
                {mapVisible && (
                    <div className="w-full aspect-video overflow-hidden rounded-md border animate-accordion-down">
                            <iframe
                            width="100%"
                            height="100%"
                            loading="lazy"
                            allowFullScreen
                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${store.latitude},${store.longitude}`}>
                        </iframe>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}

export default function CheckoutPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { items, cartTotal, clearCart, isLoading: isCartLoading } = useCart();
  const { user } = useUser();
  const firestore = useFirestore();

  const [step, setStep] = useState<CheckoutStep>('address');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Card' | 'UPI'>('COD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressDetails, setAddressDetails] = useState<GeocodedAddress | null>(null);

  const storesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'stores');
  }, [firestore]);
  const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(storesQuery);

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


  const nearestStore = useMemo(() => {
    if (!addressDetails || !stores || stores.length === 0) {
        return null;
    }

    let closest: { store: Store; distance: number } | null = null;
    const userCoords = { latitude: addressDetails.lat, longitude: addressDetails.lng };

    for (const store of stores) {
        const distance = getHaversineDistance(userCoords, { latitude: store.latitude, longitude: store.longitude });
        if (!closest || distance < closest.distance) {
            closest = { store, distance };
        }
    }
    
    if (closest) {
        const deliveryTime = 20 + Math.round(closest.distance * 5); // 20 mins base + 5 mins/km
        return {
            ...closest,
            deliveryEstimate: `${deliveryTime} - ${deliveryTime + 15} min`,
        };
    }
    return null;
  }, [addressDetails, stores]);


  const processAddress = (data: z.infer<typeof addressSchema>) => {
    if (!addressDetails) {
        toast({ title: t('geocodeError'), description: t('geocodeErrorDesc'), variant: 'destructive' });
        return;
    }
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (!user || !firestore || !items || !addressDetails) return;
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
      latitude: addressDetails.lat,
      longitude: addressDetails.lng,
      paymentMethod,
      paymentStatus: 'Pending',
      createdAt: serverTimestamp() as any,
      nearestStoreId: nearestStore?.store.id ?? 'N/A',
      deliveryEstimate: nearestStore?.deliveryEstimate ?? 'N/A',
    };

    try {
      const batch = writeBatch(firestore);
      const orderRef = doc(collection(firestore, 'users', user.uid, 'orders'));
      batch.set(orderRef, newOrder);

      for (const item of items) {
        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.id);
        batch.delete(cartItemRef);
      }
      
      await batch.commit();
      
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        
        <div className='space-y-8'>
            <div className={cn(step === 'payment' && 'hidden')}>
                <h2 className="mb-4 text-xl font-semibold">{t('address')}</h2>
                <AddressAutocomplete
                    form={form}
                    onAddressSelect={setAddressDetails}
                    onSubmit={processAddress}
                />
            </div>

            <div className={cn('transition-opacity duration-300', step === 'address' && 'hidden')}>
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
                    <Button onClick={handlePlaceOrder} disabled={isProcessing || !nearestStore} className="w-full">
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('placeOrder')} - ${cartTotal.toFixed(2)}
                    </Button>
                </div>
            </div>
        </div>

        <div className="space-y-8">
            <Card className="lg:sticky lg:top-24">
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
            {step === 'payment' && (
                <NearestStoreCard storeInfo={nearestStore} isLoading={isLoadingStores} />
            )}
        </div>
      </div>
    </div>
  );
}
