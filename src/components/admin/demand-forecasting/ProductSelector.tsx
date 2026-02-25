'use client';
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/firebase';
import { toast } from '@/hooks/use-toast';

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
                if (!auth.currentUser) {
                    throw new Error("You must be logged in to fetch products.");
                }
                const idToken = await auth.currentUser.getIdToken();
                const response = await fetch('/api/products', {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch products: ${response.status} ${errorText || response.statusText}`);
                }
                const data = await response.json();
                setProducts(data);
            } catch (error: any) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Could not load products',
                    description: error.message,
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [auth]);

    return (
        <Select onValueChange={onProductSelect} disabled={isLoading || products.length === 0}>
            <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder={isLoading ? "Loading products..." : (products.length === 0 ? "No products found" : "Select a product")} />
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
