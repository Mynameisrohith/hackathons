'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { getDocs, collectionGroup, query, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { analyzeInventory } from '@/lib/inventory-analysis';
import type { Order, Product } from '@/lib/types';
import { endOfDay, startOfDay, sub, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

// Initialize Firestore instance for server-side tool usage
let firestore: any;
try {
  firestore = initializeFirebase().firestore;
} catch (e) {
  console.error("Failed to initialize Firestore for AI tools:", e);
}

export const getInventoryAnalysis = ai.defineTool(
    {
      name: 'getInventoryAnalysis',
      description: 'Provides a detailed analysis of the current inventory, including low stock items, high demand products, and overstocked items.',
      inputSchema: z.object({}),
      outputSchema: z.any(),
    },
    async () => {
        if (!firestore) throw new Error("Firestore not initialized.");
        
        try {
            const productsQuery = query(collectionGroup(firestore, 'products'));
            const ordersQuery = query(collectionGroup(firestore, 'orders'));

            const [productsSnapshot, ordersSnapshot] = await Promise.all([
                getDocs(productsQuery),
                getDocs(ordersQuery),
            ]);

            const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
            const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];

            if (!products.length || !orders.length) {
                return "Not enough data for inventory analysis. There are no products or orders.";
            }
            
            const analysis = analyzeInventory(products, orders);
            
            const summary = {
                highDemand: analysis.risingProducts.map(p => p.name).slice(0, 3),
                lowStock: analysis.atRiskProducts.map(p => `${p.name} (${p.stock} units left, ${p.daysUntilStockout.toFixed(0)} days to stockout)`).slice(0, 3),
                overstocked: analysis.overstockedProducts.map(p => `${p.name} (${p.stock} units, >180 days supply)`).slice(0, 3),
            };

            return `Here is the inventory analysis:
- High Demand Products: ${summary.highDemand.join(', ') || 'None'}
- Low Stock Products: ${summary.lowStock.join('; ') || 'None'}
- Overstocked Products: ${summary.overstocked.join('; ') || 'None'}`;

        } catch (error: any) {
            console.error("Error in getInventoryAnalysis tool:", error);
            return `Error fetching inventory data: ${error.message}`;
        }
    }
);

export const getSalesSummary = ai.defineTool(
    {
        name: 'getSalesSummary',
        description: 'Provides a summary of sales revenue and order count for a specified period (e.g., today, this week, this month).',
        inputSchema: z.object({
            period: z.enum(['today', 'this week', 'this month', 'last 7 days']).describe("The time period for the sales summary."),
        }),
        outputSchema: z.any(),
    },
    async ({ period }) => {
        if (!firestore) throw new Error("Firestore not initialized.");

        try {
            const ordersQuery = query(collectionGroup(firestore, 'orders'));
            const ordersSnapshot = await getDocs(ordersQuery);
            const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];

            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'today':
                    startDate = startOfDay(now);
                    break;
                case 'this week':
                    startDate = startOfWeek(now);
                    break;
                case 'this month':
                    startDate = startOfMonth(now);
                    break;
                case 'last 7 days':
                    startDate = sub(now, { days: 7 });
                    break;
            }

            const filteredOrders = orders.filter(order => {
                const orderDate = order.createdAt.toDate();
                return orderDate >= startDate && order.orderStatus !== 'Cancelled';
            });

            const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            const totalOrders = filteredOrders.length;

            return `Sales summary for ${period}:
- Total Revenue: $${totalRevenue.toFixed(2)}
- Total Orders: ${totalOrders}`;

        } catch (error: any) {
            console.error("Error in getSalesSummary tool:", error);
            return `Error fetching sales data: ${error.message}`;
        }
    }
);
