import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { getAuth } from 'firebase-admin/auth';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

import { dbService } from './services/dbService';
import { fileService } from './services/fileService';
import { bedrockService } from './services/bedrockService';
import { sagemakerService } from './services/sagemakerService';

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Auth Middleware
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return res.status(401).send('Unauthorized: No token provided');
    }
    try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        (req as any).user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).send('Forbidden: Invalid token');
    }
};

const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user: DecodedIdToken | undefined = (req as any).user;
    if (!user) {
        return res.status(401).send('Unauthorized');
    }
    try {
        const userRole = await dbService.getUserRole(user.uid);
        if (userRole?.role === 'admin' && userRole?.status === 'active') {
            next();
        } else {
            return res.status(403).send('Forbidden: Insufficient permissions');
        }
    } catch (error) {
        console.error('Error checking admin role:', error);
        return res.status(500).send('Internal Server Error');
    }
};

// ============================================
//           User & Role Routes
// ============================================
app.get('/user/role', requireAuth, async (req, res) => {
    const user = (req as any).user;
    try {
        const role = await dbService.getUserRole(user.uid);
        if (role) {
            res.status(200).json(role);
        } else {
            res.status(404).send('Role not found');
        }
    } catch (error) {
        console.error('Error fetching user role:', error);
        res.status(500).send('Internal Server Error');
    }
});


// ============================================
//             Product Routes
// ============================================
app.get('/products', async (req, res) => {
    try {
        const products = await dbService.getProducts();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});


// ============================================
//          AI / ML Service Routes
// ============================================

app.post('/predict-demand', requireAuth, requireAdmin, async (req, res) => {
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

        // 3. Store the report in DynamoDB
        await dbService.saveDemandReport(report);

        res.status(200).json(report);

    } catch (error: any) {
        functions.logger.error("Error in /predict-demand:", error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

app.get('/demand-reports/:productId', requireAuth, requireAdmin, async (req, res) => {
    const { productId } = req.params;
    try {
        const reports = await dbService.getDemandReportsForProduct(productId);
        res.status(200).json(reports);
    } catch (error: any) {
         functions.logger.error(`Error fetching reports for ${productId}:`, error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
})


// Expose Express API as a single Cloud Function
export const api = functions.https.onRequest(app);
