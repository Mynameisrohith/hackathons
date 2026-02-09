'use server';
/**
 * @fileOverview An AI flow for a voice-powered admin assistant.
 *
 * - askAdminAssistant - A function that takes a user's query and returns an AI-generated response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getInventoryAnalysis, getSalesSummary, getCustomerSummary, getOrderDetails } from '../tools/admin-assistant-tools';

export const askAdminAssistant = ai.defineFlow(
  {
    name: 'askAdminAssistant',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (query) => {
    const llmResponse = await ai.generate({
      prompt: `You are a helpful and concise admin assistant for an e-commerce store called RetailSpark. Answer the user's query based on the information provided by the available tools. Be friendly and professional.

User query: "${query}"`,
      model: 'googleai/gemini-1.5-flash-latest',
      tools: [getInventoryAnalysis, getSalesSummary, getCustomerSummary, getOrderDetails],
      config: {
        temperature: 0.3,
      },
    });

    return llmResponse.text;
  }
);
