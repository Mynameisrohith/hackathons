
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { CartItem, Product } from '@/lib/types';
import { useDebouncedCallback } from 'use-debounce';

interface CartContextType {
  items: CartItem[] | null;
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  isUpdating: (itemId: string) => boolean;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [updatingItems, setUpdatingItems] = useState<string[]>([]);

  const cartQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'cart'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: items, isLoading } = useCollection<CartItem>(cartQuery);

  const cartCount = useMemo(() => items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0, [items]);
  const cartTotal = useMemo(() => items?.reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0, [items]);
  
  const isUpdating = useCallback((itemId: string) => updatingItems.includes(itemId), [updatingItems]);

  const addToCart = async (product: Product, quantity: number) => {
    if (!user || !firestore) {
      console.warn("User not authenticated. Cannot add to cart.");
      return;
    }
    setUpdatingItems(prev => [...prev, product.id]);
    try {
        const cartRef = collection(firestore, 'users', user.uid, 'cart');
        const q = query(cartRef, where('productId', '==', product.id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const cartDoc = querySnapshot.docs[0];
            const newQuantity = cartDoc.data().quantity + quantity;
            await updateDoc(cartDoc.ref, { quantity: newQuantity });
        } else {
            await addDoc(cartRef, {
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: quantity,
                imageUrl: product.imageUrl,
                stock: product.stock,
                createdAt: serverTimestamp(),
            });
        }
    } finally {
        setUpdatingItems(prev => prev.filter(id => id !== product.id));
    }
  };

  const updateQuantity = useDebouncedCallback(async (itemId: string, quantity: number) => {
    if (!user || !firestore) {
        console.warn("User not authenticated, cannot update cart.");
        return;
    }
    if (quantity < 1) {
        await removeFromCart(itemId);
        return;
    }
    setUpdatingItems(prev => [...prev, itemId]);
    try {
        const itemRef = doc(firestore, 'users', user.uid, 'cart', itemId);
        await updateDoc(itemRef, { quantity });
    } finally {
        setUpdatingItems(prev => prev.filter(id => id !== itemId));
    }
  }, 500);

  const removeFromCart = async (itemId: string) => {
    if (!user || !firestore) {
      console.warn("User not authenticated. Cannot remove from cart.");
      return;
    }
    setUpdatingItems(prev => [...prev, itemId]);
    try {
        const itemRef = doc(firestore, 'users', user.uid, 'cart', itemId);
        await deleteDoc(itemRef);
    } finally {
        setUpdatingItems(prev => prev.filter(id => id !== itemId));
    }
  };
  
  const clearCart = () => {
    // This is called after a successful order. The batch write handles deletion.
    // This function primarily clears the local state via the onSnapshot listener.
  }

  const value = {
    items,
    cartCount,
    cartTotal,
    isLoading,
    isUpdating,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
