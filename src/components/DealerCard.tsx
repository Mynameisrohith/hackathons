
'use client';

import React, { useState } from 'react';
import { MapPin, Star, Truck, ShieldCheck, PlusCircle, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Dealer } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useFirestore } from '@/firebase';
import { addPlaceAsStore } from '@/lib/store-manager';
import { Skeleton } from './ui/skeleton';

interface DealerCardProps {
  dealer: Dealer;
  isSelected: boolean;
  onSelect: () => void;
}

export function DealerCard({ dealer, isSelected, onSelect }: DealerCardProps) {
  const { t } = useLanguage();
  const { isAdmin } = useAdmin();
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddDealer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !dealer.placeId) return;
    setIsAdding(true);
    await addPlaceAsStore(firestore, dealer);
    setIsAdding(false);
  };

  const isRegistered = dealer.status === 'Registered';

  return (
    <Card
      onClick={onSelect}
      className={cn(
        'cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-glass',
        isSelected ? 'ring-2 ring-primary shadow-2xl' : 'hover:ring-1 hover:ring-primary/50'
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-start justify-between">
          <span className="text-base font-bold">{dealer.name}</span>
          <Badge variant={isRegistered ? 'default' : 'secondary'} className="shrink-0">
            {isRegistered ? <ShieldCheck className="mr-1.5 h-3 w-3" /> : <Building className="mr-1.5 h-3 w-3" />}
            {isRegistered ? t('registeredDealer') : t('newDealer')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <p className="truncate">{dealer.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 shrink-0" />
          <p>{dealer.distance.toFixed(1)} km away</p>
        </div>
        {dealer.rating && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 shrink-0 text-yellow-400" />
            <p>{dealer.rating} ({dealer.userRatingsTotal} reviews)</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isAdmin && !isRegistered && (
          <Button variant="outline" size="sm" className="w-full" onClick={handleAddDealer} disabled={isAdding}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {isAdding ? t('adding') : t('addAsDealer')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function DealerCardSkeleton() {
  return (
    <Card className="card-glass">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-4/5" />
        </div>
         <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}
