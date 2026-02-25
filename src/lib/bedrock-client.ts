
'use client';

// IMPORTANT: This URL will be specific to your Firebase project and region.
// You can find it in the Firebase console after deploying the function.
// It typically looks like: https://<region>-<project-id>.cloudfunctions.net/aiAssistant
const CLOUD_FUNCTION_URL = 'https://us-central1-studio-1170291343-515ee.cloudfunctions.net/aiAssistant';

/**
 * Calls the secure Firebase Cloud Function to get a response from Bedrock.
 * @param prompt The user's text prompt.
 * @returns The AI's response text.
 */
export async function fetchBedrockResponse(prompt: string): Promise<string> {
    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        return data.reply;

    } catch (error) {
        console.error("Error fetching Bedrock response:", error);
        throw new Error("Could not connect to the AI assistant. Please check the function logs and ensure the URL is correct.");
    }
}
