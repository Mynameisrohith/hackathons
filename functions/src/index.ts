
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as nodemailer from "nodemailer";
import { defineString } from "firebase-functions/params";
import { Order, UserProfile } from "./types";
import { orderConfirmationTemplate, statusUpdateTemplate, feedbackRequestTemplate, cancellationNotificationTemplate, newOrderAdminNotificationTemplate } from "./templates";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Environment Parameters
const NODEMAILER_USER = defineString("NODEMAILER_USER");
const NODEMAILER_PASS = defineString("NODEMAILER_PASS");
const ADMIN_EMAIL = defineString("NODEMAILER_ADMIN");

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: NODEMAILER_USER,
        pass: NODEMAILER_PASS,
    },
});

export const onOrderWrite = onDocumentWritten(
    {
        document: "users/{userId}/orders/{orderId}",
        secrets: [NODEMAILER_PASS],
    },
    async (event) => {
        if (!NODEMAILER_USER.value() || !NODEMAILER_PASS.value() || !ADMIN_EMAIL.value()) {
            logger.error("Email environment variables are not set. Halting function.");
            return;
        }

        const beforeData = event.data?.before.data() as Order | undefined;
        const afterData = event.data?.after.data() as Order | undefined;
        const orderId = event.params.orderId;

        // Fetch user data
        let userProfile: UserProfile | null = null;
        try {
            const userDoc = await db.collection("users").doc(event.params.userId).get();
            if (userDoc.exists) {
                userProfile = userDoc.data() as UserProfile;
            } else {
                logger.error(`User profile not found for userId: ${event.params.userId}`);
                return;
            }
        } catch (error) {
            logger.error(`Error fetching user profile for userId: ${event.params.userId}`, error);
            return;
        }

        if (!userProfile?.email) {
            logger.error(`User ${userProfile?.id} does not have an email address.`);
            return;
        }

        // ---> Order Creation <---
        if (!beforeData && afterData) {
            logger.log(`New order ${orderId} created for user ${userProfile.email}.`);
            const orderWithId = { ...afterData, id: orderId };

            // Send confirmation email to user
            await transporter.sendMail({
                from: `"RetailSpark" <${NODEMAILER_USER.value()}>`,
                to: userProfile.email,
                subject: `Your RetailSpark Order #${orderId} is Confirmed!`,
                html: orderConfirmationTemplate(orderWithId, userProfile),
            });

            // Send notification email to admin
            await transporter.sendMail({
                from: `"RetailSpark" <${NODEMAILER_USER.value()}>`,
                to: ADMIN_EMAIL.value(),
                subject: `New Order Received #${orderId}`,
                html: newOrderAdminNotificationTemplate(orderWithId, userProfile),
            });
            return;
        }

        // ---> Order Update <---
        if (beforeData && afterData && beforeData.deliveryStatus !== afterData.deliveryStatus) {
            const newStatus = afterData.deliveryStatus;
            logger.log(`Order ${orderId} status changed to ${newStatus}.`);
            const orderWithId = { ...afterData, id: orderId };

            // Delivered: Send feedback request
            if (newStatus === "Delivered") {
                await transporter.sendMail({
                    from: `"RetailSpark" <${NODEMAILER_USER.value()}>`,
                    to: userProfile.email,
                    subject: `How was your delivery for order #${orderId}?`,
                    html: feedbackRequestTemplate(orderWithId, userProfile),
                });
            }
            // Cancelled: Send admin notification
            else if (newStatus === "Cancelled") {
                await transporter.sendMail({
                    from: `"RetailSpark" <${NODEMAILER_USER.value()}>`,
                    to: ADMIN_EMAIL.value(),
                    subject: `Order #${orderId} has been Cancelled`,
                    html: cancellationNotificationTemplate(orderWithId),
                });
            }
            // Other status change (e.g., Shipped): Send user update
            else {
                await transporter.sendMail({
                    from: `"RetailSpark" <${NODEMAILER_USER.value()}>`,
                    to: userProfile.email,
                    subject: `Update on your RetailSpark Order #${orderId}`,
                    html: statusUpdateTemplate(orderWithId, userProfile),
                });
            }
            return;
        }

        logger.log(`Function executed for order ${orderId}, but no action was taken.`);
    }
);
