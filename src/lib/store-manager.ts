'use client';
import { collection, addDoc, query, where, getDocs, serverTimestamp, Firestore } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import type { Dealer } from '@/lib/types';

export async function addPlaceAsStore(firestore: Firestore, dealer: Dealer) {
    if (!dealer.placeId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Place has no ID.' });
        return;
    }

    const storesRef = collection(firestore, 'stores');
    const q = query(storesRef, where('placeId', '==', dealer.placeId));

    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(storesRef, {
                name: dealer.name,
                address: dealer.address,
                latitude: dealer.latitude,
                longitude: dealer.longitude,
                placeId: dealer.placeId,
                active: true,
                createdAt: serverTimestamp(),
                phone: '', // phone is not on Dealer type, so empty string is ok.
                stock: {}, // Initialize with empty stock
            });
            toast({ title: 'Success', description: `${dealer.name} has been added as a registered dealer.` });
        } else {
            toast({ variant: 'default', title: 'Already Registered', description: 'This dealer is already in your list.' });
        }
    } catch(e: any) {
        console.error("Error adding dealer: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add dealer.' });
    }
}
