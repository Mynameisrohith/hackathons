
'use client';
import { collection, addDoc, query, where, getDocs, serverTimestamp, Firestore } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import type { Place } from '@/lib/types';

export async function addPlaceAsStore(firestore: Firestore, place: Place) {
    if (!place.place_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Place has no ID.' });
        return;
    }

    const storesRef = collection(firestore, 'stores');
    const q = query(storesRef, where('placeId', '==', place.place_id));

    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(storesRef, {
                name: place.name,
                address: place.vicinity,
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
                placeId: place.place_id,
                active: true,
                createdAt: serverTimestamp(),
                phone: place.formatted_phone_number || ''
            });
            toast({ title: 'Success', description: `${place.name} has been added as a registered dealer.` });
        } else {
            toast({ variant: 'default', title: 'Already Registered', description: 'This dealer is already in your list.' });
        }
    } catch(e: any) {
        console.error("Error adding dealer: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add dealer.' });
    }
}
