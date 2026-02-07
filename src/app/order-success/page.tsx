
'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function OrderSuccessPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 animate-card-enter">
        <CheckCircle2 className="h-24 w-24 text-green-500" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">
        {t('orderSuccessTitle')}
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        {t('orderSuccessDesc')}
      </p>
      {orderId && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t('orderId')}: <span className="font-mono">{orderId}</span>
        </p>
      )}
      <Button asChild className="mt-8">
        <Link href="/products">{t('continueShopping')}</Link>
      </Button>
    </div>
  );
}
