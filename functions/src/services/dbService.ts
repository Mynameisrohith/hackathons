import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import * as functions from "firebase-functions";
import { DemandPrediction } from "./sagemakerService";

const awsConfig = {
    region: functions.config().aws.region,
    credentials: {
        accessKeyId: functions.config().aws.key,
        secretAccessKey: functions.config().aws.secret,
    },
};

const client = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(client);

const ROLES_TABLE = "roles";
const USERS_TABLE = "users";
const PRODUCTS_TABLE = "products";
const AI_REPORTS_TABLE = "ai_reports";

// ============================================
//            User and Role Methods
// ============================================
const getUserRole = async (userId: string) => {
    const command = new GetCommand({
        TableName: ROLES_TABLE,
        Key: { userId },
    });
    const { Item } = await docClient.send(command);
    return Item;
};

const createUser = async (userId: string, email: string, displayName: string | null, photoURL: string | null) => {
    // Check if user already exists
    const existingUser = await docClient.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId }}));
    if (existingUser.Item) {
        console.log(`User ${userId} already exists. Skipping creation.`);
        return existingUser.Item;
    }

    const userPayload = {
        userId,
        email,
        displayName: displayName || 'New User',
        photoURL: photoURL || '',
        createdAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({ TableName: USERS_TABLE, Item: userPayload }));
    return userPayload;
};

// ============================================
//             Product Methods
// ============================================
const getProducts = async () => {
    const command = new ScanCommand({
        TableName: PRODUCTS_TABLE,
    });
    const { Items } = await docClient.send(command);
    return Items;
};


// ============================================
//             AI Report Methods
// ============================================
const saveDemandReport = async (report: DemandPrediction & { summary: string }) => {
    const item = {
        ...report,
        createdAt: new Date().toISOString(),
    };

    const command = new PutCommand({
        TableName: AI_REPORTS_TABLE,
        Item: item,
    });

    await docClient.send(command);
    return item;
};

const getDemandReportsForProduct = async (productId: string) => {
     const command = new QueryCommand({
        TableName: AI_REPORTS_TABLE,
        KeyConditionExpression: "productId = :productId",
        ExpressionAttributeValues: {
            ":productId": productId,
        },
        // Sort by timestamp descending, limit to last 30 reports
        ScanIndexForward: false, 
        Limit: 30
    });

    const { Items } = await docClient.send(command);
    // The results are descending, so we reverse to get ascending for charting
    return Items?.reverse() || [];
}


export const dbService = {
    getUserRole,
    createUser,
    getProducts,
    saveDemandReport,
    getDemandReportsForProduct,
};
