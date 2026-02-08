'use client';

import { useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

/**
 * A custom React hook that tracks the user's geolocation in real-time and updates
 * a specified Firestore document with the latest coordinates. Designed for delivery partners.
 *
 * @param orderId The ID of the order document to update.
 * @param userId The ID of the user who placed the order.
 */
export function useRealtimeLocationUpdater(orderId: string, userId: string) {
  const firestore = useFirestore();
  const watchIdRef = useRef<number | null>(null);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!orderId || !userId || !firestore || !navigator.geolocation) {
      return;
    }

    const orderRef = doc(firestore, 'users', userId, 'orders', orderId);

    const successCallback: PositionCallback = (position) => {
      const { latitude, longitude } = position.coords;
      updateDoc(orderRef, {
        deliveryBoyLat: latitude,
        deliveryBoyLng: longitude,
        updatedAt: serverTimestamp(),
      }).catch(error => {
        console.error("Failed to update location:", error);
        // Consider stopping if there are persistent errors
      });
    };

    const errorCallback: PositionErrorCallback = (error) => {
      console.error(`Geolocation error: ${error.message}`);
      stopTracking(); // Stop on error to avoid battery drain
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 0,
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );

    // Cleanup function to stop watching when the component unmounts
    return () => {
      stopTracking();
    };
  }, [orderId, userId, firestore, stopTracking]);
  
  return { stopTracking };
}
