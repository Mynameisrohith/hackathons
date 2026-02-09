
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/context/CartContext';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { writeBatch, doc, serverTimestamp, collection } from 'firebase/firestore';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import type { Order, CartItem, Dealer, UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { AddressAutocomplete, GeocodedAddress } from '@/components/AddressAutocomplete';
import { DealerDiscovery } from '@/components/DealerDiscovery';
import { sendEmail } from '@/lib/email-client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  const [addressDetails, setAddressDetails] = useState<GeocodedAddress | null>(null);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  
  const userDocRef = useMemo(() => user ? doc(firestore!, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);


  useEffect(() => {
    const scriptId = 'razorpay-checkout-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }
  }, []);

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
    if (!addressDetails) {
        toast({ title: t('geocodeError'), description: t('geocodeErrorDesc'), variant: 'destructive' });
        return;
    }
    setStep('payment');
  };
  
  const createOrderInFirestore = async (paymentId?: string) => {
    if (!user || !firestore || !items || !addressDetails || !selectedDealer || !userProfile) {
        toast({ title: 'Error', description: 'Missing required information to place order.', variant: 'destructive'});
        return;
    };

    const addressData = form.getValues();
    const orderItems: Omit<CartItem, 'id' | 'createdAt' | 'stock'>[] = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    }));

    const orderRef = doc(collection(firestore, 'users', user.uid, 'orders'));

    const newOrder: Order = {
      id: orderRef.id,
      userId: user.uid,
      userEmail: user.email || '',
      items: orderItems,
      totalAmount: cartTotal,
      ...addressData,
      latitude: addressDetails.lat,
      longitude: addressDetails.lng,
      paymentMethod,
      paymentStatus: paymentId ? 'Paid' : 'Pending',
      paymentId: paymentId || '',
      orderStatus: 'Pending',
      createdAt: new Date() as any, 
      updatedAt: new Date() as any,
      dealerName: selectedDealer.name,
      dealerAddress: selectedDealer.address,
      dealerLat: selectedDealer.latitude,
      dealerLng: selectedDealer.longitude,
      dealerPlaceId: selectedDealer.placeId,
    };

    try {
      const batch = writeBatch(firestore);
      batch.set(orderRef, { ...newOrder, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

      for (const item of items) {
        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.id);
        batch.delete(cartItemRef);
      }
      
      await batch.commit();
      clearCart();
      await sendEmail({ emailType: 'order-confirmation', order: newOrder, user: userProfile });
      router.push(`/my-orders?orderId=${orderRef.id}&success=true`);

    } catch (error) {
      console.error('Error placing order:', error);
      toast({ title: t('orderError'), description: t('orderErrorDesc'), variant: 'destructive' });
    }
  };

  const handlePayment = async () => {
    if (!selectedDealer) {
        toast({title: 'No Dealer Selected', description: 'Please select a dispatch dealer.', variant: 'destructive'});
        return;
    }

    setIsProcessing(true);

    if (paymentMethod === 'COD') {
        await createOrderInFirestore();
        setIsProcessing(false);
        return;
    }
    
    // For Card/UPI, use Razorpay
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        toast({ title: 'Configuration Error', description: 'Razorpay is not configured.', variant: 'destructive'});
        setIsProcessing(false);
        return;
    }
    
    // In a real app, you'd fetch an order_id from your backend here for security
    // const orderResponse = await fetch('/api/razorpay/create-order', {..});

    const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: cartTotal * 100, // Amount in paise
        currency: "INR",
        name: "RetailSpark",
        description: "Order Transaction",
        // order_id: from_backend, 
        handler: async (response: any) => {
            // In a real app, verify payment signature on backend before creating Firestore order
            await createOrderInFirestore(response.razorpay_payment_id);
        },
        prefill: {
            name: user?.displayName || '',
            email: user?.email || '',
            contact: form.getValues('phone'),
        },
        notes: {
            address: form.getValues('address'),
        },
        theme: {
            color: "#2563EB", // Blue-500
        },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response: any){
        toast({ variant: 'destructive', title: 'Payment Failed', description: response.error.description });
        setIsProcessing(false);
    });
    rzp.open();
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
              {addressDetails && (
                <DealerDiscovery
                  userLocation={addressDetails}
                  onDealerSelect={setSelectedDealer}
                />
              )}
              
              <div className="mt-8">
                  <h2 className="mb-4 text-xl font-semibold">{t('paymentMethod')}</h2>
                  <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as any)} className="space-y-4">
                      <Label htmlFor="cod" className="flex cursor-pointer items-center rounded-lg border p-4 has-[:checked]:border-primary">
                          <RadioGroupItem value="COD" id="cod" />
                          <div className="ml-4">
                              <p className="font-medium">{t('cashOnDelivery')}</p>
                              <p className="text-sm text-muted-foreground">{t('cashOnDeliveryDesc')}</p>
                          </div>
                      </Label>
                      <Label htmlFor="card" className="flex cursor-pointer items-center rounded-lg border p-4 has-[:checked]:border-primary">
                          <RadioGroupItem value="Card" id="card"/>
                          <div className="ml-4">
                              <p className="font-medium">{t('creditDebitCard')}</p>
                              <p className="text-sm text-muted-foreground">{t('creditDebitCardDesc')}</p>
                          </div>
                      </Label>
                      <Label htmlFor="upi" className="flex cursor-pointer items-center rounded-lg border p-4 has-[:checked]:border-primary">
                          <RadioGroupItem value="UPI" id="upi"/>
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
                      <Button onClick={handlePayment} disabled={isProcessing || !selectedDealer} className="w-full">
                          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {paymentMethod === 'COD' ? t('placeOrder') : 'Proceed to Pay'} - ${cartTotal.toFixed(2)}
                      </Button>
                  </div>
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
        </div>
      </div>
    </div>
  );
}
