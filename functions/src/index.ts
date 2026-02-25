
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { getAuth } from 'firebase-admin/auth';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

import { predictDemand } from './predictDemand';
import { getUserRoleFromFirestore } from './services/dbService';

// Initialize Firebase Admin SDK
admin.initializeApp();
const firestore = admin.firestore();

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
        const userRole = await getUserRoleFromFirestore(firestore, user.uid);
        if (userRole?.role === 'admin' && userRole?.status === 'active') {
            next();
        } else {
            return res.status(403).send('Forbidden: Insufficient permissions');
        }
    } catch (error: any) {
        console.error('Error checking admin role:', error);
        return res.status(500).send(`Internal Server Error: ${error.message}`);
    }
};

// ============================================
//           User & Role Routes
// ============================================
app.get('/user/role', requireAuth, async (req, res) => {
    const user = (req as any).user;
    try {
        const role = await getUserRoleFromFirestore(firestore, user.uid);
        if (role) {
            res.status(200).json(role);
        } else {
            res.status(404).send('Role not found');
        }
    } catch (error: any) {
        console.error('Error fetching user role:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});


// ============================================
//          AI / ML Service Routes
// ============================================

app.post('/predict-demand', requireAuth, requireAdmin, predictDemand);

app.get('/demand-reports/:productId', requireAuth, requireAdmin, async (req, res) => {
    const { productId } = req.params;
    try {
        const reportsSnap = await firestore.collection('ai_reports')
            .where('productId', '==', productId)
            .orderBy('createdAt', 'desc')
            .limit(30)
            .get();
            
        if (reportsSnap.empty) {
            return res.status(200).json([]);
        }

        const reports = reportsSnap.docs.map(doc => doc.data());
        res.status(200).json(reports.reverse());

    } catch (error: any) {
         functions.logger.error(`Error fetching reports for ${productId}:`, error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
})


// Expose Express API as a single Cloud Function
export const api = functions.https.onRequest(app);
