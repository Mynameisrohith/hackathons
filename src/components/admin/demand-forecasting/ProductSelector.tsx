
'use client';
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/firebase';

interface Product {
    productId: string;
    name: string;
}

interface ProductSelectorProps {
    onProductSelect: (productId: string) => void;
}

export default function ProductSelector({ onProductSelect }: ProductSelectorProps) {
    const auth = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!auth) return;
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const idToken = await auth.currentUser?.getIdToken();
                const response = await fetch('/api/products', {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (!response.ok) throw new Error('Failed to fetch products');
                const data = await response.json();
                setProducts(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [auth]);

    return (
        <Select onValueChange={onProductSelect} disabled={isLoading}>
            <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder={isLoading ? "Loading products..." : "Select a product"} />
            </SelectTrigger>
            <SelectContent>
                {products.map(product => (
                    <SelectItem key={product.productId} value={product.productId}>
                        {product.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
