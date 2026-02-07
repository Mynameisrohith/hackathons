
"use client";

import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Truck, RotateCcw, PackageCheck } from 'lucide-react';

export default function ShippingReturnsPage() {
  const { t } = useLanguage();

  return (
    <div className="animate-card-enter">
      <PageHeader
        title={t('shippingReturnsTitle')}
        subtitle={t('shippingReturnsSubtitle')}
      />
      <main className="container mx-auto px-4 py-12 space-y-16">
        <section>
            <h2 className="text-3xl font-bold text-center mb-10">Shipping Policy</h2>
             <div className="max-w-4xl mx-auto space-y-4 text-muted-foreground">
                <p>We are committed to delivering your products in a timely and secure manner. All orders are dispatched from our network of registered dealers to ensure the fastest possible delivery.</p>
                <ul className="list-disc list-inside space-y-2">
                    <li>Standard shipping is free for all orders.</li>
                    <li>Orders are typically processed within 1-2 business days.</li>
                    <li>Delivery times vary from 2-7 business days depending on your location.</li>
                    <li>You will receive a tracking number via email as soon as your order is shipped.</li>
                </ul>
            </div>
        </section>

        <section>
            <h2 className="text-3xl font-bold text-center mb-10">Return Process</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
                 <Card className="card-glass hover-lift">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                            <Truck className="w-8 h-8" />
                        </div>
                        <CardTitle>Step 1: Initiate</CardTitle>
                    </CardHeader>
                    <CardContent>Contact our support team within 30 days of receiving your order to initiate a return.</CardContent>
                </Card>
                <Card className="card-glass hover-lift" style={{ animationDelay: '100ms' }}>
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                            <RotateCcw className="w-8 h-8" />
                        </div>
                        <CardTitle>Step 2: Pack & Ship</CardTitle>
                    </CardHeader>
                    <CardContent>Securely pack the item in its original packaging. We will arrange a pickup from your address.</CardContent>
                </Card>
                 <Card className="card-glass hover-lift" style={{ animationDelay: '200ms' }}>
                    <CardHeader>
                         <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                            <PackageCheck className="w-8 h-8" />
                        </div>
                        <CardTitle>Step 3: Refund</CardTitle>
                    </CardHeader>
                    <CardContent>Once we receive and inspect the item, your refund will be processed within 5-7 business days.</CardContent>
                </Card>
            </div>
        </section>
      </main>
    </div>
  );
}
