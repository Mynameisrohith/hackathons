import { NextResponse } from 'next/server';
import { firestore } from '@/ai/tools/firebase';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import type { Product, Order } from '@/lib/types';

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_GENAI_API_KEY}`;

// Main POST handler for the chat API
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, userId, language = 'English' } = body;

        if (!message || !userId) {
            return NextResponse.json({ error: 'Message and userId are required' }, { status: 400 });
        }
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            return NextResponse.json({ error: 'AI API key is not configured on the server.' }, { status: 500 });
        }

        // 1. Fetch context from Firestore
        const context = await getFirestoreContext(userId);

        // 2. Construct the prompt for Gemini
        const systemInstruction = `You are Commerce360 AI, an expert assistant for the RetailSpark e-commerce platform.
- Use only the provided context data to answer questions.
- If the information is not in the context, politely state that you cannot provide the information. Do not invent details.
- Respond in the user's language, which is ${language}.
- Keep answers concise and helpful.

CONTEXT:
${context}
`;

        const prompt = `${systemInstruction}\n\nUser Question: "${message}"`;
        
        // 3. Call Gemini API
        const geminiResponse = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
                safetySettings: [ // Add safety settings to avoid blocks on common retail terms
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ]
            }),
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Gemini API Error:", errorBody);
            throw new Error(`Gemini API request failed with status ${geminiResponse.status}`);
        }
        
        const data = await geminiResponse.json();

        // 4. Extract reply and send response
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";
        
        return NextResponse.json({ reply });

    } catch (error) {
        console.error('AI Chat API Error:', error);
        return NextResponse.json({ error: 'Failed to get a response from the AI assistant.' }, { status: 500 });
    }
}

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
