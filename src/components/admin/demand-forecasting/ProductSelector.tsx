'use client';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/types';

interface ProductSelectorProps {
    onProductSelect: (productId: string) => void;
}

export default function ProductSelector({ onProductSelect }: ProductSelectorProps) {
    const firestore = useFirestore();
    
    const productsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'products')) : null,
        [firestore]
    );

    const { data: products, isLoading } = useCollection<Product>(productsQuery);

    return (
        <Select onValueChange={onProductSelect} disabled={isLoading || !products || products.length === 0}>
            <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder={isLoading ? "Loading products..." : (!products || products.length === 0 ? "No products found" : "Select a product")} />
            </SelectTrigger>
            <SelectContent>
                {products?.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                        {product.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
