'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { GeocodedAddress, Dealer, Place, CartItem } from '@/lib/types';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, doc, getDoc } from 'firebase/firestore';
import type { Store } from '@/lib/types';
import { getHaversineDistance } from '@/lib/geolocation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Map, Navigation, XCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { DealerCard, DealerCardSkeleton } from './DealerCard';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';

interface DealerDiscoveryProps {
  userLocation: GeocodedAddress;
  onDealerSelect: (dealer: Dealer | null) => void;
  items: CartItem[];
}

export function DealerDiscovery({ userLocation, onDealerSelect, items }: DealerDiscoveryProps) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [discoveredDealers, setDiscoveredDealers] = useState<Dealer[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  const storesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'stores'));
  }, [firestore]);

  const { data: registeredStores, isLoading: isLoadingStores } = useCollection<Store>(storesQuery);
  
  const selectedDealer = useMemo(() => {
    return discoveredDealers.find(d => d.id === selectedDealerId) ?? null;
  }, [discoveredDealers, selectedDealerId]);


  useEffect(() => {
    onDealerSelect(selectedDealer);
  }, [selectedDealer, onDealerSelect]);

  useEffect(() => {
    const findDealers = async () => {
      setIsLoading(true);
      setError(null);
      setDiscoveredDealers([]);
      setSelectedDealerId(null);

      const userCoords = { latitude: userLocation.lat, longitude: userLocation.lng };

      // 1. Process registered stores from Firestore
      const registeredDealerList: Dealer[] = (registeredStores || []).map(store => ({
        ...store,
        status: 'Registered',
        distance: getHaversineDistance(userCoords, store),
      }));
      
      // 2. Determine keyword for Google Places search
      let keyword = 'supermarket|grocery|electronics|pharmacy|store'; // Default keyword
      if (items.length > 0 && items[0].categoryId && firestore) {
        try {
            const categoryRef = doc(firestore, 'categories', items[0].categoryId);
            const categorySnap = await getDoc(categoryRef);
            if (categorySnap.exists()) {
                const categoryName = categorySnap.data().name.toLowerCase();
                keyword = encodeURIComponent(categoryName);
            }
        } catch (e) {
            console.warn("Could not fetch category name for keyword search, using default.", e);
        }
      }

      // 3. Check if any registered store is within 20km
      const nearbyRegistered = registeredDealerList.filter(d => d.distance <= 20);

      if (nearbyRegistered.length > 0) {
        const sortedDealers = nearbyRegistered.sort((a, b) => a.distance - b.distance);
        setDiscoveredDealers(sortedDealers);
        setSelectedDealerId(sortedDealers[0].id);
        setIsLoading(false);
        return;
      }
      
      // 4. If no nearby registered stores, fetch from Google Places API
      try {
        const response = await fetch(`/api/places?lat=${userLocation.lat}&lng=${userLocation.lng}&keyword=${keyword}`);
        if (!response.ok) throw new Error('Failed to fetch from Places API');
        
        const data = await response.json();
        if (data.status === 'ZERO_RESULTS') {
          setError(t('noDealersFoundError'));
          setIsLoading(false);
          return;
        }

        if (data.status !== 'OK') throw new Error(data.details || 'Google Places API error');

        const places: Place[] = data.results;

        const allDealers: Dealer[] = [
            ...registeredDealerList.filter(d => d.distance > 20), // Keep far away registered dealers
            ...places.map((place): Dealer => {
                const isRegistered = registeredDealerList.some(rd => rd.placeId === place.place_id);
                return {
                    id: place.place_id,
                    placeId: place.place_id,
                    name: place.name,
                    address: place.vicinity,
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                    rating: place.rating,
                    userRatingsTotal: place.user_ratings_total,
                    status: isRegistered ? 'Registered' : 'New',
                    distance: getHaversineDistance(userCoords, {
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                    }),
                }
            })
        ].sort((a,b) => a.distance - b.distance);

        if (allDealers.length === 0) {
          setError(t('noDealersFoundError'));
        } else {
          setDiscoveredDealers(allDealers);
          setSelectedDealerId(allDealers[0].id);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An unknown error occurred while finding dealers.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userLocation && !isLoadingStores) {
      findDealers();
    }
  }, [userLocation, registeredStores, isLoadingStores, t, items, firestore]);


  if (isLoading || isLoadingStores) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t('findingDealers')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DealerCardSkeleton />
                <DealerCardSkeleton />
            </div>
        </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('error')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-xl font-semibold mb-1">{t('selectDealer')}</h2>
            <p className="text-sm text-muted-foreground">{t('selectDealerDesc')}</p>
        </div>
        
        {discoveredDealers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveredDealers.slice(0, 4).map(dealer => (
                    <DealerCard 
                        key={dealer.id}
                        dealer={dealer}
                        isSelected={dealer.id === selectedDealerId}
                        onSelect={() => setSelectedDealerId(dealer.id)}
                    />
                ))}
            </div>
        ) : (
             <Alert>
                <XCircle className="h-4 w-4" />
                <AlertTitle>{t('noDealersFoundTitle')}</AlertTitle>
                <AlertDescription>{t('noDealersFoundDesc')}</AlertDescription>
            </Alert>
        )}
      
        {selectedDealer && (
            <Card className="card-glass animate-card-enter">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Map size={22} /> {t('deliveryDispatch')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="font-medium">{t('from')}: <span className="text-primary">{selectedDealer.name}</span></p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{t('distance')}</span>
                        <span className="font-semibold text-foreground">{selectedDealer.distance.toFixed(1)} km</span>
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2">
                    <div className='flex gap-4'>
                        <Button variant="link" className="p-0 h-auto" onClick={() => setMapVisible(!mapVisible)}>
                            {mapVisible ? t('hideMap') : t('showMap')}
                        </Button>
                        <Button variant="link" className="p-0 h-auto" asChild>
                            <a href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedDealer.latitude},${selectedDealer.longitude}`} target='_blank' rel='noopener noreferrer'>
                                {t('getDirections')} <Navigation className='ml-2 h-4 w-4' />
                            </a>
                        </Button>
                    </div>
                    {mapVisible && (
                        <div className="w-full aspect-video overflow-hidden rounded-md border animate-accordion-down">
                                <iframe
                                width="100%"
                                height="100%"
                                loading="lazy"
                                allowFullScreen
                                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${selectedDealer.placeId}`}>
                            </iframe>
                        </div>
                    )}
                </CardFooter>
            </Card>
        )}
    </div>
  );
}
