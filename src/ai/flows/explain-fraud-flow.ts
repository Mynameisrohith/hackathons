'use server';
/**
 * @fileOverview An AI flow to explain retail fraud metrics.
 *
 * - explainFraudMetrics - A function that takes fraud metrics and returns an AI-powered explanation.
 * - FraudMetricsInput - The input type for the explainFraudMetrics function.
 * - AIFraudReportOutput - The return type for the explainFraudMetrics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FraudMetricsInputSchema = z.object({
  fraudScore: z.number().describe('The overall fraud score from 0 to 100.'),
  suspiciousPatterns: z.object({
    duplicateComments: z.number().describe('Number of reviews with identical comments.'),
    ratingSpike: z.boolean().describe('Whether there was a sudden spike in 5-star ratings today.'),
    shortComments: z.number().describe('Number of reviews with very short, likely spammy, comments.'),
    rapidReviews: z.number().describe('Number of reviews submitted by the same user in a short period.'),
    abnormalFrequency: z.boolean().describe('Whether the review frequency today is abnormally high.'),
  }).describe('A summary of suspicious patterns detected.'),
});
export type FraudMetricsInput = z.infer<typeof FraudMetricsInputSchema>;

const AIFraudReportOutputSchema = z.object({
  fraudSummary: z.string().describe("A concise, one-sentence summary of the fraud risk level."),
  keyConcerns: z.array(z.string()).describe("A bulleted list of the most critical issues detected."),
  recommendedActions: z.array(z.string()).describe("A bulleted list of actionable steps to mitigate the identified risks."),
});
export type AIFraudReportOutput = z.infer<typeof AIFraudReportOutputSchema>;


export async function explainFraudMetrics(input: FraudMetricsInput): Promise<AIFraudReportOutput> {
  return explainFraudFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainFraudPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: FraudMetricsInputSchema},
  output: {schema: AIFraudReportOutputSchema},
  prompt: `You are a Retail Fraud Analyst AI. Your task is to analyze fraud metrics from an e-commerce platform and provide a clear, concise report for the business owner.

Analyze the following fraud metrics:
- Fraud Score: {{{fraudScore}}}
- Suspicious Patterns:
  - Duplicate Comments: {{{suspiciousPatterns.duplicateComments}}}
  - 5-Star Rating Spike Today: {{{suspiciousPatterns.ratingSpike}}}
  - Spam-like Short Comments: {{{suspiciousPatterns.shortComments}}}
  - Rapid Same-User Reviews: {{{suspiciousPatterns.rapidReviews}}}
  - Abnormal Review Frequency Today: {{{suspiciousPatterns.abnormalFrequency}}}

Based on this data, generate a structured report.
- **fraudSummary**: A single sentence that summarizes the current fraud risk. (e.g., "Fraud risk is currently low, with only minor irregularities detected.")
- **keyConcerns**: Identify the top 2-3 most pressing issues. If the score is low, you can state that there are no major concerns.
- **recommendedActions**: Suggest concrete, actionable steps the owner can take. For example, "Manually review reviews from users X, Y, and Z," or "Monitor products A and B for further unusual activity." If there are no concerns, suggest something like "Continue monitoring standard metrics."

Keep your language clear, direct, and business-focused. Avoid technical jargon.`,
});

const explainFraudFlow = ai.defineFlow(
  {
    name: 'explainFraudFlow',
    inputSchema: FraudMetricsInputSchema,
    outputSchema: AIFraudReportOutputSchema,
  },
  async input => {
    if (input.fraudScore < 10) {
        return {
            fraudSummary: "Fraud risk is currently very low.",
            keyConcerns: ["No significant concerns detected."],
            recommendedActions: ["Continue standard monitoring of reviews and sales patterns."]
        };
    }

    const {output} = await prompt(input);
    return output!;
  }
);
