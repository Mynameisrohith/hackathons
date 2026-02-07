
'use client';

import { useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { getHaversineDistance } from './geolocation';

const SIMULATION_INTERVAL = 5000; // 5 seconds
const AVG_SPEED_KMH = 30; // Average speed of a delivery driver in km/h

/**
 * A custom React hook to simulate the movement of a delivery person for a given order.
 * This should only be used on the client-side, typically on an order tracking page.
 *
 * @param order The order object to track. The simulation starts when its status is 'Out for Delivery'.
 */
export function useDeliveryTracker(order: Order | null) {
  const firestore = useFirestore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Stop any existing simulation if order changes or unmounts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!order || !firestore || order.orderStatus !== 'Out for Delivery') {
      return;
    }

    const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);

    const startSimulation = async () => {
      let currentLat = order.deliveryBoyLat ?? order.dealerLat;
      let currentLng = order.deliveryBoyLng ?? order.dealerLng;

      // If the delivery boy position is not set, initialize it to the dealer's location
      if (!order.deliveryBoyLat || !order.deliveryBoyLng) {
        await updateDoc(orderRef, {
          deliveryBoyLat: currentLat,
          deliveryBoyLng: currentLng,
        });
      }

      intervalRef.current = setInterval(async () => {
        const customerLocation = { latitude: order.latitude, longitude: order.longitude };
        const currentLocation = { latitude: currentLat, longitude: currentLng };
        
        const distanceToDestination = getHaversineDistance(currentLocation, customerLocation);
        const distanceCoveredInInterval = (AVG_SPEED_KMH * (SIMULATION_INTERVAL / 3600000));
        
        // If we are very close, finalize the delivery
        if (distanceToDestination < distanceCoveredInInterval) {
          await updateDoc(orderRef, {
            deliveryBoyLat: customerLocation.latitude,
            deliveryBoyLng: customerLocation.longitude,
            orderStatus: 'Delivered',
            deliveryStatus: 'Delivered',
            updatedAt: serverTimestamp(),
          });
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        // Calculate the next position
        const fraction = distanceCoveredInInterval / distanceToDestination;
        currentLat += (customerLocation.latitude - currentLat) * fraction;
        currentLng += (customerLocation.longitude - currentLng) * fraction;

        const totalDistance = getHaversineDistance(
            { latitude: order.dealerLat, longitude: order.dealerLng }, 
            customerLocation
        );
        const estimatedArrivalMinutes = Math.round((distanceToDestination / AVG_SPEED_KMH) * 60);

        // Update Firestore with the new position
        await updateDoc(orderRef, {
          deliveryBoyLat: currentLat,
          deliveryBoyLng: currentLng,
          estimatedArrivalMinutes,
          updatedAt: serverTimestamp(),
        });
      }, SIMULATION_INTERVAL);
    };

    startSimulation();

    // Cleanup function to clear interval on component unmount or if order changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [order, firestore]);
}
