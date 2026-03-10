
import type { Request, Response } from 'express';
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

import { bedrockService } from './services/bedrockService';
// Note: We are reading pre-computed results from Firestore by default.
// The sagemakerService would be used for real-time inference.
// import { sagemakerService } from './services/sagemakerService';

/**
 * Handles the /api/predict-demand endpoint.
 *
 * COST-OPTIMIZED STRATEGY (Default):
 * This function reads the LATEST pre-computed batch prediction result from Firestore.
 * It does NOT invoke SageMaker in real-time to keep costs minimal.
 *
 * ENTERPRISE STRATEGY (Optional):
 * For real-time predictions, you can uncomment the sagemakerService block.
 * This will invoke the SageMaker endpoint for every request, which incurs cost.
 */
export const predictDemand = async (req: Request, res: Response) => {
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).send('Bad Request: productId is required.');
    }

    try {
        // --- COST-OPTIMIZED: Read latest prediction from Firestore ---
        const reportQuery = await firestore()
            .collection('ai_reports')
            .where('productId', '==', productId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (reportQuery.empty) {
            return res.status(404).send({
                message: "No demand prediction report found for this product.",
                suggestion: "Run the batch prediction pipeline to generate forecasts."
            });
        }
        
        const latestReport = reportQuery.docs[0].data();

        // (Bonus) Get AI summary from Bedrock based on the fetched report
        const summary = await bedrockService.generatePredictionSummary(latestReport);
        
        const finalReport = { ...latestReport, summary };

        // Save the report with the new AI summary back to Firestore
        // This is useful if you want to cache the AI summary
        await firestore().collection('ai_reports').doc(reportQuery.docs[0].id).set(finalReport, { merge: true });

        res.status(200).json(finalReport);

    } catch (error: any) {
        functions.logger.error("Error in /predict-demand:", error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }


    /*
    // --- ENTERPRISE: Real-time SageMaker Invocation (Optional) ---

    const { productId, salesData } = req.body;
    if (!productId || !salesData) {
        return res.status(400).send('Bad Request: productId and salesData are required.');
    }
    try {
        // 1. Get prediction from SageMaker
        const prediction = await sagemakerService.getDemandPrediction({ productId, salesData });

        // 2. (Bonus) Get AI summary from Bedrock
        const summary = await bedrockService.generatePredictionSummary(prediction);
        
        const report = { ...prediction, summary };

        // 3. Store the new real-time report in Firestore
        await firestore().collection('ai_reports').add({
            ...report,
            createdAt: firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json(report);

    } catch (error: any) {
        functions.logger.error("Error in /predict-demand:", error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
    */
};
