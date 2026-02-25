
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import * as cors from "cors";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize CORS middleware
// You can restrict the origin to your app's domain for production
const corsHandler = cors({ origin: true });

// Securely get AWS credentials from Firebase Functions configuration
// In production, it's even better to use a service account with IAM roles
const awsConfig = {
    region: functions.config().aws.region,
    credentials: {
        accessKeyId: functions.config().aws.key,
        secretAccessKey: functions.config().aws.secret,
    },
};

const bedrockClient = new BedrockRuntimeClient(awsConfig);

export const aiAssistant = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        if (request.method !== "POST") {
            response.status(405).send("Method Not Allowed");
            return;
        }

        try {
            const { prompt } = request.body;

            if (!prompt) {
                response.status(400).send("Bad Request: Missing 'prompt' in request body.");
                return;
            }

            const bedrockRequest = new ConverseCommand({
                modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
                messages: [{ role: "user", content: [{ text: prompt }] }],
                inferenceConfig: { maxTokens: 2048, temperature: 0.5 },
                system: [{ text: "You are a helpful e-commerce assistant for the RetailSpark platform." }],
            });

            const bedrockResponse = await bedrockClient.send(bedrockRequest);
            
            if (bedrockResponse.output?.message?.content?.[0]?.text) {
                const aiResponse = bedrockResponse.output.message.content[0].text;
                response.status(200).json({ reply: aiResponse });
            } else {
                throw new Error("Invalid response structure from Bedrock.");
            }

        } catch (error) {
            functions.logger.error("Error calling Bedrock:", error);
            response.status(500).send("Internal Server Error: Could not get response from AI assistant.");
        }
    });
});
