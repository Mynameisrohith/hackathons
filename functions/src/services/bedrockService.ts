import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import * as functions from "firebase-functions";
import type { DemandPrediction } from "./sagemakerService";

const awsConfig = {
    region: functions.config().aws.region,
    credentials: {
        accessKeyId: functions.config().aws.key,
        secretAccessKey: functions.config().aws.secret,
    },
};

const bedrockClient = new BedrockRuntimeClient(awsConfig);

const generatePredictionSummary = async (prediction: DemandPrediction): Promise<string> => {
    const modelId = functions.config().bedrock.model_id || "anthropic.claude-3-sonnet-20240229-v1:0";

    const systemPrompt = `You are a concise and insightful retail analyst AI. Your task is to interpret a demand forecast report and provide a brief, actionable summary for a business manager. Focus on the most critical numbers and their implications. Use markdown for formatting, such as bolding and bullet points.`;
    
    const userPrompt = `
    Please analyze the following demand forecast for Product ID ${prediction.productId} and provide a summary.

    - **Predicted Demand (Next 7 Days):** ${prediction.predictedDemand7d} units
    - **Predicted Demand (Next 30 Days):** ${prediction.predictedDemand30d} units
    - **Stockout Risk:** ${(prediction.stockoutRisk * 100).toFixed(1)}%
    - **Model Confidence Score:** ${(prediction.confidenceScore * 100).toFixed(1)}%

    Generate a summary that includes:
    1.  A one-sentence overview of the short-term demand.
    2.  A clear statement on the stockout risk and what it means.
    3.  A bulleted list of 1-2 recommended actions.
    `;

    try {
        const bedrockRequest = new ConverseCommand({
            modelId,
            messages: [{ role: "user", content: [{ text: userPrompt }] }],
            system: [{ text: systemPrompt }],
            inferenceConfig: { maxTokens: 512, temperature: 0.3 },
        });

        const bedrockResponse = await bedrockClient.send(bedrockRequest);
        
        if (bedrockResponse.output?.message?.content?.[0]?.text) {
            return bedrockResponse.output.message.content[0].text;
        } else {
            throw new Error("Invalid response structure from Bedrock.");
        }

    } catch (error) {
        functions.logger.error("Error generating prediction summary from Bedrock:", error);
        // Return a default summary on error to avoid breaking the whole flow
        return "Could not generate AI summary. Please check the raw prediction data.";
    }
};

export const bedrockService = {
    generatePredictionSummary,
};
