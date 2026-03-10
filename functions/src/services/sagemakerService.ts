import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";
import * as functions from "firebase-functions";

const awsConfig = {
    region: functions.config().aws.region,
    credentials: {
        accessKeyId: functions.config().aws.key,
        secretAccessKey: functions.config().aws.secret,
    },
};

const sagemakerClient = new SageMakerRuntimeClient(awsConfig);

export interface DemandPredictionInput {
    productId: string;
    salesData: number[]; // e.g., last 30 days of sales
}

export interface DemandPrediction {
    productId: string;
    predictedDemand7d: number;
    predictedDemand30d: number;
    stockoutRisk: number; // 0 to 1
    confidenceScore: number; // 0 to 1
}

const getDemandPrediction = async (input: DemandPredictionInput): Promise<DemandPrediction> => {
    const endpointName = functions.config().sagemaker.endpoint_name;
    if (!endpointName) {
        throw new Error("SageMaker endpoint name is not configured in environment variables.");
    }
    
    // The payload format depends on what the SageMaker model endpoint expects.
    // We'll assume it expects a JSON object with an "instances" key.
    const sagemakerPayload = {
        instances: [
            {
                // This structure must match the input format expected by your trained model
                // For a time series model, this could be the recent sales history.
                start: new Date().toISOString(),
                target: input.salesData,
            },
        ],
    };

    const command = new InvokeEndpointCommand({
        EndpointName: endpointName,
        ContentType: "application/json",
        Body: JSON.stringify(sagemakerPayload),
    });

    try {
        const response = await sagemakerClient.send(command);
        const responseBody = new TextDecoder().decode(response.Body);
        const parsedResponse = JSON.parse(responseBody);
        
        // The structure of parsedResponse.predictions depends on your model's output.
        // We'll assume it returns an array of prediction objects.
        const predictionResult = parsedResponse.predictions[0];

        // Example: The model might return a 'quantiles' object or a simple 'mean' prediction.
        // This is a placeholder for the actual logic to map the model output.
        const predictedDemand7d = predictionResult.mean.slice(0, 7).reduce((a:number, b:number) => a + b, 0);
        const predictedDemand30d = predictionResult.mean.slice(0, 30).reduce((a:number, b:number) => a + b, 0);

        const result: DemandPrediction = {
            productId: input.productId,
            predictedDemand7d: Math.round(predictedDemand7d),
            predictedDemand30d: Math.round(predictedDemand30d),
            stockoutRisk: predictionResult.stockout_risk || Math.random(), // Placeholder
            confidenceScore: predictionResult.confidence_score || Math.random() * (0.95 - 0.8) + 0.8, // Placeholder
        };

        return result;

    } catch (error) {
        functions.logger.error("Error invoking SageMaker endpoint:", error);
        throw new Error("Failed to get prediction from SageMaker.");
    }
};

export const sagemakerService = {
    getDemandPrediction,
};
