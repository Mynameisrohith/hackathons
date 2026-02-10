'use server';
/**
 * @fileOverview An AI flow that generates a high-level strategic summary for the business.
 *
 * - getStrategicInsight - A function that analyzes business data and returns an AI-generated insight.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { firestore } from '@/ai/tools/firebase';
import { collection, query, getDocs, collectionGroup } from 'firebase/firestore';
import type { Order, Product, Review, UserProfile, Store } from '@/lib/types';
import { analyzeInventory } from '@/lib/inventory-analysis';
import { calculateFraudMetrics } from '@/lib/fraud-analysis';

export const getStrategicInsight = ai.defineFlow(
  {
    name: 'getStrategicInsight',
    inputSchema: z.null(),
    outputSchema: z.string(),
  },
  async () => {
    // 1. Fetch all necessary data from Firestore
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

    // 2. Run deterministic AI modules
    const inventoryAnalysis = analyzeInventory(products, orders);
    const fraudAnalysis = calculateFraudMetrics(reviews, orders, users);

    // 3. Construct the prompt context
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
    
    // 4. Construct the final prompt
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
    
    // 5. Call Genkit AI
    const llmResponse = await ai.generate({
        model: 'gemini-pro',
        prompt: prompt,
        config: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 250,
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
        },
    });

    return llmResponse.text || "I'm sorry, I couldn't generate a strategic insight at this time. Please check the data sources and try again.";
  }
);
