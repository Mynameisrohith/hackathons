
import { NextResponse } from 'next/server';
import { firestore } from '@/ai/tools/firebase'; // Re-use the server-side firestore instance
import { collection, query, getDocs, collectionGroup } from 'firebase/firestore';
import type { Order, Product, Review, UserProfile, Store } from '@/lib/types';
import { GoogleAuth } from 'google-auth-library';
import { firebaseConfig } from '@/firebase/config';
import { analyzeInventory } from '@/lib/inventory-analysis';
import { calculateFraudMetrics } from '@/lib/fraud-analysis';

// Main POST handler for the insight API
export async function POST(request: Request) {
    try {
        // In a real app, you might protect this route by checking for an admin user session
        
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

        // 2. Fetch all necessary data from Firestore
        const [ordersSnapshot, productsSnapshot, reviewsSnapshot, usersSnapshot, storesSnapshot] = await Promise.all([
            getDocs(query(collectionGroup(firestore, 'orders'))),
            getDocs(query(collection(firestore, 'products'))),
            getDocs(query(collection(firestore, 'reviews'))),
            getDocs(query(collection(firestore, 'users'))),
            getDocs(query(collection(firestore, 'stores'))),
        ]);

        const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);
        const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Review);
        const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
        const stores = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Store);

        // 3. Run deterministic AI modules
        const inventoryAnalysis = analyzeInventory(products, orders);
        const fraudAnalysis = calculateFraudMetrics(reviews, orders, users);

        // 4. Construct the prompt context
        let context = "=== Commerce360 AI Business Metrics ===\n\n";

        // Inventory & Demand Insights
        context += "--- Inventory & Demand ---\n";
        context += `Market Health (Weekly Growth): ${(inventoryAnalysis.marketAnalysis.weeklyGrowth * 100).toFixed(1)}%\n`;
        context += `Market Volatility: ${inventoryAnalysis.marketAnalysis.volatility}\n`;
        context += `Top 3 Rising Products: ${inventoryAnalysis.risingProducts.slice(0, 3).map(p => p.name).join(', ') || 'None'}\n`;
        context += `Top 3 Declining Products: ${inventoryAnalysis.decliningProducts.slice(0, 3).map(p => p.name).join(', ') || 'None'}\n`;
        context += `Products at High Risk of Stockout: ${inventoryAnalysis.atRiskProducts.filter(p => p.riskLevel === 'High').length}\n`;
        context += `Overstocked Products: ${inventoryAnalysis.overstockedProducts.length}\n\n`;

        // Fraud Insights
        context += "--- Fraud & Risk ---\n";
        if (fraudAnalysis) {
            context += `Overall Fraud Risk Score: ${fraudAnalysis.metrics.fraudScore}/100\n`;
            context += `Risk Level: ${fraudAnalysis.riskLevel}\n`;
            context += `Duplicate Comments Detected: ${fraudAnalysis.metrics.suspiciousPatterns.duplicateComments}\n`;
            context += `Abnormal Review Frequency Today: ${fraudAnalysis.metrics.suspiciousPatterns.abnormalFrequency ? 'Yes' : 'No'}\n`;
            context += `Users with High Cancellation Rate: ${fraudAnalysis.highCancellationRateUsers.length}\n`;
        } else {
            context += "Not enough data for fraud analysis.\n";
        }
        
        // 5. Construct the final prompt
        const systemInstruction = `You are Commerce360 AI, a strategic business analyst. Your task is to analyze the provided real-time business metrics from an e-commerce platform and generate a concise, actionable, high-level strategic summary for the CEO.

Focus on the most critical takeaways. Identify the biggest opportunities and the most urgent threats.

- Use only the provided metrics. Do not fabricate numbers or information.
- Be direct and start with the most important insight.
- Keep the summary to 3-4 bullet points.
- The tone should be professional, insightful, and strategic.

METRICS:
${context}
`;
        const prompt = `${systemInstruction}\n\nGenerate the strategic summary.`;

        // 6. Call Vertex AI API
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
                ],
                generationConfig: {
                    temperature: 0.4,
                    topP: 0.9,
                    maxOutputTokens: 250,
                }
            }),
        });
        
        if (!vertexResponse.ok) {
            const errorBody = await vertexResponse.text();
            console.error("Vertex AI Error:", errorBody);
            throw new Error(`Vertex AI request failed with status ${vertexResponse.status}`);
        }
        
        const data = await vertexResponse.json();
        
        // 7. Extract reply and send response
        const insight = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a strategic insight at this time. Please check the data sources and try again.";
        
        return NextResponse.json({ insight });

    } catch (error: any) {
        console.error('AI Insight API Error:', error.message);
        return NextResponse.json({ error: 'Failed to get a response from the AI assistant.' }, { status: 500 });
    }
}
