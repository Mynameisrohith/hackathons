'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Order, Store } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ReassignDealerDialogProps {
    order: Order;
    children: React.ReactNode;
}

export function ReassignDealerDialog({ order, children }: ReassignDealerDialogProps) {
    const firestore = useFirestore();
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const storesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stores')) : null, [firestore]);
    const { data: stores, isLoading } = useCollection<Store>(storesQuery);

    const handleAssign = async () => {
        if (!firestore || !selectedStoreId) return;

        const selectedStore = stores?.find(s => s.id === selectedStoreId);
        if (!selectedStore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected store not found.' });
            return;
        }

        setIsAssigning(true);
        const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);
        try {
            await updateDoc(orderRef, {
                dealerId: selectedStore.id,
                dealerName: selectedStore.name,
                dealerAddress: selectedStore.address,
                dealerLat: selectedStore.latitude,
                dealerLng: selectedStore.longitude,
                dealerPlaceId: selectedStore.placeId,
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Success', description: `Order reassigned to ${selectedStore.name}.` });
            setIsOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to reassign order.' });
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reassign Dealer for Order #{order.id.slice(0, 6)}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="mb-2 text-sm text-muted-foreground">Current Dealer: <strong>{order.dealerName}</strong></p>
                    <Select onValueChange={setSelectedStoreId} disabled={isLoading}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a new dealer..." />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoading ? (
                                <SelectItem value="loading" disabled>Loading dealers...</SelectItem>
                            ) : (
                                stores?.map(store => (
                                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleAssign} disabled={!selectedStoreId || isAssigning}>
                        {isAssigning && <Loader2 className="mr-2 animate-spin" />}
                        Assign to Dealer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
