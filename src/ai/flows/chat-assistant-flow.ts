'use server';
/**
 * @fileOverview An AI flow for the customer-facing chat assistant.
 *
 * - chatWithAssistant - A function that takes a user's message and ID, and returns an AI-generated response.
 * - ChatInput - The input type for the chatWithAssistant function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { firestore } from '@/ai/tools/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import type { Product, Order } from '@/lib/types';

// Schema for the flow input
export const ChatInputSchema = z.object({
  message: z.string(),
  userId: z.string(),
  language: z.string().default('English'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

// Helper to fetch and format data from Firestore
async function getFirestoreContext(userId: string): Promise<string> {
    try {
        // Fetch top 5 products
        const productsQuery = query(collection(firestore, 'products'), orderBy('name'), limit(5));
        const productsSnapshot = await getDocs(productsQuery);
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        const productContext = products.map(p => `- ${p.name} (Price: $${p.price}, Stock: ${p.stock})`).join('\n');

        // Fetch user's 3 most recent orders
        const ordersQuery = query(collection(firestore, `users/${userId}/orders`), orderBy('createdAt', 'desc'), limit(3));
        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        const orderContext = orders.map(o => {
             const itemsSummary = o.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');
             return `- Order #${o.id.slice(0,6)} (Status: ${o.orderStatus}, Total: $${o.totalAmount.toFixed(2)}, Items: ${itemsSummary})`;
        }).join('\n');

        let context = "=== Available Products ===\n";
        context += products.length > 0 ? productContext : "No product information available.";
        context += "\n\n=== User's Recent Orders ===\n";
        context += orders.length > 0 ? orderContext : "User has no recent orders.";

        return context;
    } catch (e) {
        console.error("Failed to fetch Firestore context:", e);
        return "Could not retrieve store data.";
    }
}


export const chatWithAssistant = ai.defineFlow(
  {
    name: 'chatWithAssistant',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async ({ message, userId, language }) => {
    const context = await getFirestoreContext(userId);

    const systemInstruction = `You are Commerce360 AI Assistant.
- Only use provided Firestore data.
- Do not fabricate numbers.
- If information is unavailable, respond politely.
- Respond in the user's language, which is ${language}.

CONTEXT:
${context}
`;
    const prompt = `${systemInstruction}\n\nUser Question: "${message}"`;

    const llmResponse = await ai.generate({
      model: 'gemini-pro',
      prompt: prompt,
      config: {
        temperature: 0.3,
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ]
      },
    });

    return llmResponse.text;
  }
);
