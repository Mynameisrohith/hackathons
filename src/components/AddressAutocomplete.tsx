
'use client';

import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useForm, UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { getGeocodeWithFallback, extractAddressComponent } from '@/lib/geocoding-client';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import { MapPreview } from './MapPreview';

const addressSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Must be a 10-digit phone number'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a 6-digit pincode'),
});

export interface GeocodedAddress {
    address: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
}

interface AddressAutocompleteProps {
    form: UseFormReturn<z.infer<typeof addressSchema>>;
    onAddressSelect: (details: GeocodedAddress | null) => void;
    onSubmit: (data: z.infer<typeof addressSchema>) => void;
}

const libraries: "places"[] = ['places'];

export function AddressAutocomplete({ form, onAddressSelect, onSubmit }: AddressAutocompleteProps) {
  const { t } = useLanguage();
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: 'in' } },
    debounce: 300,
  });

  useEffect(() => {
    form.setValue('address', value);
  }, [value, form]);

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    setIsGeocoding(true);
    try {
        const results = await getGeocodeWithFallback({ address });
        const { lat, lng } = results.geometry.location;
        const city = extractAddressComponent(results.address_components, 'locality');
        const pincode = extractAddressComponent(results.address_components, 'postal_code');
        
        const details = {
            address: results.formatted_address,
            city: city || form.getValues('city'),
            pincode: pincode || form.getValues('pincode'),
            lat: lat(),
            lng: lng(),
        }
        form.setValue('address', details.address);
        form.setValue('city', city || '');
        form.setValue('pincode', pincode || '');
        onAddressSelect(details);

    } catch (error) {
      console.error('Error geocoding address: ', error);
      onAddressSelect(null);
    } finally {
        setIsGeocoding(false);
    }
  };

  const handleManualGeocode = async () => {
    const address = form.getValues('address');
    if (!address) return;
    await handleSelect(address);
  };

  if (loadError) return <div>{t('mapError')}</div>;
  if (!isLoaded) return <div><Loader2 className="animate-spin" /></div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="customerName" render={({ field }) => (
            <FormItem><FormLabel>{t('fullName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>{t('phone')}</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('address')}</FormLabel>
                    <div className="relative">
                        <FormControl>
                            <Input
                                {...field}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                disabled={!ready}
                                placeholder={t('searchAddressPlaceholder')}
                            />
                        </FormControl>
                        {status === 'OK' && (
                            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                            {data.map(({ place_id, description }) => (
                                <div
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="p-2 hover:bg-muted cursor-pointer"
                                >
                                {description}
                                </div>
                            ))}
                            </div>
                        )}
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem><FormLabel>{t('city')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="pincode" render={({ field }) => (
            <FormItem><FormLabel>{t('pincode')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>

        <Button type="submit" className="w-full">
            {t('continueToPayment')}
        </Button>
      </form>
    </Form>
  );
}

