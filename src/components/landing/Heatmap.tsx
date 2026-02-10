"use client";

import { motion } from "framer-motion";
import React, { useMemo } from "react";
import { useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from "../ui/skeleton";


// --- Data Aggregation Hook ---

export interface ZoneDemand {
  pincode: string;
  totalOrders: number;
  revenue: number;
  avgDeliveryTime: number; // in minutes
  location: {
    lat: number;
    lng: number;
  };
}

export function useZoneDemand() {
  const firestore = useFirestore();

  const allOrdersQuery = useMemoFirebase(() => {
    if(!firestore) return null;
    return query(collectionGroup(firestore, 'orders'));
  }, [firestore]);
  
  const { data: allOrders, isLoading } = useCollection<Order>(allOrdersQuery);

  const zoneData = useMemo(() => {
    if (!allOrders) return [];

    const demandByPincode: { [key: string]: {
        pincode: string;
        totalOrders: number;
        revenue: number;
        totalDeliveryMinutes: number;
        deliveredCount: number;
        latitudes: number[];
        longitudes: number[];
    } } = {};
    
    for (const order of allOrders) {
        if (!order.pincode) continue;
        
        if (!demandByPincode[order.pincode]) {
             demandByPincode[order.pincode] = {
                pincode: order.pincode,
                totalOrders: 0,
                revenue: 0,
                totalDeliveryMinutes: 0,
                deliveredCount: 0,
                latitudes: [],
                longitudes: [],
            };
        }
        
        const zone = demandByPincode[order.pincode];
        zone.totalOrders++;
        zone.latitudes.push(order.latitude);
        zone.longitudes.push(order.longitude);
        
        if (order.orderStatus === 'Delivered') {
            zone.revenue += order.totalAmount;
            zone.deliveredCount++;
            
            const createdAt = (order.createdAt as any)?.seconds;
            const updatedAt = (order.updatedAt as any)?.seconds;

            if (createdAt && updatedAt) {
                const deliveryMinutes = (updatedAt - createdAt) / 60;
                if (deliveryMinutes > 0) {
                    zone.totalDeliveryMinutes += deliveryMinutes;
                }
            }
        }
    }

    return Object.values(demandByPincode).map((zone): ZoneDemand => {
        const avgLat = zone.latitudes.length > 0 ? zone.latitudes.reduce((a,b) => a+b, 0) / zone.latitudes.length : 0;
        const avgLng = zone.longitudes.length > 0 ? zone.longitudes.reduce((a,b) => a+b, 0) / zone.longitudes.length : 0;
        
        return {
            pincode: zone.pincode,
            totalOrders: zone.totalOrders,
            revenue: zone.revenue,
            avgDeliveryTime: zone.deliveredCount > 0 ? Math.round(zone.totalDeliveryMinutes / zone.deliveredCount) : 0,
            location: {
                lat: avgLat,
                lng: avgLng,
            },
        };
    }).filter(zone => zone.totalOrders > 0);

  }, [allOrders]);

  return { data: zoneData, isLoading };
}


// --- Visualization Components ---

const Dot = ({
  duration,
  size,
  x,
  y,
  opacity,
}: {
  duration: number;
  size: number;
  x: string;
  y: string;
  opacity: number;
}) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      left: x,
      top: y,
      background: `radial-gradient(circle, hsl(var(--accent)) 0%, hsl(var(--accent) / 0) 60%)`,
    }}
    animate={{
      opacity: [0, opacity, opacity, 0],
      scale: [0.5, 1, 1, 0.5],
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay: Math.random() * duration,
    }}
  />
);

export default function HeatmapSection() {
  const { data: zoneData, isLoading } = useZoneDemand();
  
  // Normalize data for visualization
  const maxOrders = useMemo(() => {
      if (!zoneData || zoneData.length === 0) return 1;
      return Math.max(...zoneData.map(z => z.totalOrders), 1);
  }, [zoneData]);
  
  // A simple way to distribute pincodes across the view for visualization
  // This is not a geographic map, but a visual representation of demand hotspots
  const dots = useMemo(() => {
    if (isLoading || !zoneData || zoneData.length === 0) return [];
    
    // Simple hashing function to get a pseudo-random but consistent position for a pincode
    const hashPincode = (pincode: string) => {
        let hash = 0;
        for (let i = 0; i < pincode.length; i++) {
            const char = pincode.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    return zoneData.map((zone) => {
        const intensity = zone.totalOrders / maxOrders;
        const hash = hashPincode(zone.pincode);
        return {
            id: zone.pincode,
            duration: 3 + Math.random() * 4,
            size: 15 + intensity * 40,
            opacity: 0.4 + intensity * 0.6,
            x: `${(hash % 80) + 10}%`,
            y: `${(hash % 60) + 20}%`,
        }
    });
  }, [zoneData, isLoading, maxOrders]);

  return (
    <section className="py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-2xl bg-secondary p-8 sm:p-16 min-h-[400px]"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.15)_0,_transparent_50%)]" />
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,white_20%,transparent_80%)]">
            {isLoading 
             ? <div className="flex items-center justify-center h-full"><Skeleton className="w-1/2 h-1/2" /></div>
             : dots.map((dot) => <Dot key={dot.id} {...dot} />)
            }
          </div>
        </div>

        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl text-glow">
            Zone-Based AI Demand Intelligence
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Visualize demand hotspots in real-time, predict regional trends, and
            optimize stock allocation across your entire dealer network.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
