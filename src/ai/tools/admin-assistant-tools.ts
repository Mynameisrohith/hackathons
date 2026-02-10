'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getDocs, collectionGroup, query, collection, where } from 'firebase/firestore';
import { firestore } from './firebase';
import { analyzeInventory } from '@/lib/inventory-analysis';
import type { Order, Product, UserProfile } from '@/lib/types';
import { endOfDay, startOfDay, sub, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { toDate } from '@/lib/date-utils';


export const getInventoryAnalysis = ai.defineTool(
    {
      name: 'getInventoryAnalysis',
      description: 'Provides a detailed analysis of the current inventory, including low stock items, high demand products, and overstocked items.',
      inputSchema: z.object({}),
      outputSchema: z.any(),
    },
    async () => {
        try {
            const productsQuery = query(collection(firestore, 'products'));
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
                const orderDate = toDate(order.createdAt);
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

export const getCustomerSummary = ai.defineTool(
    {
        name: 'getCustomerSummary',
        description: 'Provides a summary of customer statistics, including total customers and new customers for a given period.',
        inputSchema: z.object({
            period: z.enum(['this week', 'this month', 'all time']).describe("The time period for the new customer summary. 'all time' returns total customers only."),
        }),
        outputSchema: z.any(),
    },
    async ({ period }) => {
        try {
            const usersQuery = query(collection(firestore, 'users'));
            const usersSnapshot = await getDocs(usersQuery);
            const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];

            const now = new Date();
            let startDate: Date | null = null;
            let periodString = "since the beginning";

            if (period === 'this week') {
                startDate = startOfWeek(now);
                periodString = "this week";
            } else if (period === 'this month') {
                startDate = startOfMonth(now);
                periodString = "this week";
            }
            
            const newCustomers = startDate 
                ? users.filter(user => user.creationTime && toDate(user.creationTime) >= startDate!).length
                : 0;

            let response = `Total customers: ${users.length}.`;
            if (period !== 'all time') {
                response += `\n- New customers ${periodString}: ${newCustomers}.`;
            }
            
            return response;

        } catch (error: any) {
            console.error("Error in getCustomerSummary tool:", error);
            return `Error fetching customer data: ${error.message}`;
        }
    }
);

export const getOrderDetails = ai.defineTool(
    {
        name: 'getOrderDetails',
        description: 'Retrieves the details for a specific order by its full ID.',
        inputSchema: z.object({
            orderId: z.string().describe("The full ID of the order to retrieve."),
        }),
        outputSchema: z.any(),
    },
    async ({ orderId }) => {
        if (!orderId || orderId.length < 5) return "Please provide a valid, full order ID.";

        try {
            const ordersQuery = query(collectionGroup(firestore, 'orders'), where('id', '==', orderId));
            const ordersSnapshot = await getDocs(ordersQuery);

            if (ordersSnapshot.empty) {
                return `Order with ID ${orderId} not found. Please ensure you are using the full order ID.`;
            }
            
            const orderDoc = ordersSnapshot.docs[0];
            const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;

            const orderSummary = {
                id: orderData.id,
                customerName: orderData.customerName,
                totalAmount: orderData.totalAmount,
                orderStatus: orderData.orderStatus,
                paymentStatus: orderData.paymentStatus,
                itemCount: orderData.items.length,
                items: orderData.items.map(item => `${item.productName} (x${item.quantity})`).join(', '),
                dealerName: orderData.dealerName,
                createdAt: toDate(orderData.createdAt).toLocaleString(),
            };

            return `Here are the details for order ${orderId}: ${JSON.stringify(orderSummary, null, 2)}`;

        } catch (error: any) {
            console.error("Error in getOrderDetails tool:", error);
            return `Error fetching order data: ${error.message}`;
        }
    }
);
