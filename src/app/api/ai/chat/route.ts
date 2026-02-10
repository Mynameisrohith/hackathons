
import { NextResponse } from 'next/server';
import { firestore } from '@/ai/tools/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import type { Product, Order } from '@/lib/types';
import { GoogleAuth } from 'google-auth-library';
import { firebaseConfig } from '@/firebase/config';

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


// Main POST handler for the chat API
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, userId, language = 'English' } = body;

        if (!message || !userId) {
            return NextResponse.json({ error: 'Message and userId are required' }, { status: 400 });
        }

        // 1. Authenticate with Vertex AI
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
        });
        const client = await auth.getClient();
        const accessToken = (await client.getAccessToken())?.token;

        if (!accessToken) {
            return NextResponse.json({ error: 'Could not obtain access token.' }, { status: 500 });
        }
        
        const projectId = firebaseConfig.projectId;
        if (!projectId) {
             return NextResponse.json({ error: 'Firebase Project ID is not configured.' }, { status: 500 });
        }

        const VERTEX_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-pro:generateContent`;


        // 2. Fetch context from Firestore
        const context = await getFirestoreContext(userId);

        // 3. Construct the prompt for Gemini
        const systemInstruction = `You are Commerce360 AI Assistant.
- Only use provided Firestore data.
- Do not fabricate numbers.
- If information is unavailable, respond politely.
- Respond in the user's language, which is ${language}.

CONTEXT:
${context}
`;
        const prompt = `${systemInstruction}\n\nUser Question: "${message}"`;
        
        // 4. Call Vertex AI API
        const vertexResponse = await fetch(VERTEX_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
                safetySettings: [
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ]
            }),
        });

        if (!vertexResponse.ok) {
            const errorBody = await vertexResponse.text();
            console.error("Vertex AI Error:", errorBody);
            throw new Error(`Vertex AI request failed with status ${vertexResponse.status}`);
        }
        
        const data = await vertexResponse.json();

        // 5. Extract reply and send response
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";
        
        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('AI Chat API Error:', error.message);
        return NextResponse.json({ error: 'Failed to get a response from the AI assistant.' }, { status: 500 });
    }
}
