'use server';
/**
 * @fileOverview An AI flow for a voice-powered admin assistant.
 *
 * - askAdminAssistant - A function that takes a user's query and returns an AI-generated response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getInventoryAnalysis, getSalesSummary } from '../tools/admin-assistant-tools';
import { flow } from 'genkit';

export const askAdminAssistant = flow(
  {
    name: 'askAdminAssistant',
    inputSchema: z.string(),
    outputSchema: z.string(),
    middleware: [],
  },
  async (query) => {
    const llmResponse = await ai.generate({
      prompt: query,
      model: 'googleai/gemini-1.5-pro-latest',
      tools: [getInventoryAnalysis, getSalesSummary],
      config: {
        temperature: 0.3,
      },
    });

    return llmResponse.text;
  }
);
