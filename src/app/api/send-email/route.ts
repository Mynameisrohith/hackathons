
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { EmailPayload, Order, UserProfile } from '@/lib/types';
import { 
    orderConfirmationTemplate, 
    statusUpdateTemplate, 
    feedbackRequestTemplate, 
    cancellationNotificationTemplate, 
    newOrderAdminNotificationTemplate 
} from '@/lib/email-templates';

export async function POST(request: Request) {
    const { emailType, order, user } = (await request.json()) as EmailPayload;

    const { 
        EMAIL_USER, 
        EMAIL_PASS, 
        ADMIN_EMAIL 
    } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS || !ADMIN_EMAIL) {
        console.error("Email environment variables are not set. Halting function.");
        return NextResponse.json({ message: "Server configuration error: Email credentials missing." }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });

    try {
        switch (emailType) {
            case 'order-confirmation':
                // Send confirmation email to user
                await transporter.sendMail({
                    from: `"RetailSpark" <${EMAIL_USER}>`,
                    to: user.email,
                    subject: `Your RetailSpark Order #${order.id} is Confirmed!`,
                    html: orderConfirmationTemplate(order, user),
                });
                // Send notification email to admin
                await transporter.sendMail({
                    from: `"RetailSpark" <${EMAIL_USER}>`,
                    to: ADMIN_EMAIL,
                    subject: `New Order Received #${order.id}`,
                    html: newOrderAdminNotificationTemplate(order, user),
                });
                break;
            
            case 'status-update':
                 await transporter.sendMail({
                    from: `"RetailSpark" <${EMAIL_USER}>`,
                    to: user.email,
                    subject: `Update on your RetailSpark Order #${order.id}`,
                    html: statusUpdateTemplate(order, user),
                });
                break;

            case 'feedback-request':
                 await transporter.sendMail({
                    from: `"RetailSpark" <${EMAIL_USER}>`,
                    to: user.email,
                    subject: `How was your delivery for order #${order.id}?`,
                    html: feedbackRequestTemplate(order, user),
                });
                break;

            case 'cancellation-notification':
                 await transporter.sendMail({
                    from: `"RetailSpark" <${EMAIL_USER}>`,
                    to: ADMIN_EMAIL, // Also notify user? Maybe just admin for now.
                    subject: `Order #${order.id} has been Cancelled`,
                    html: cancellationNotificationTemplate(order),
                });
                break;
            
            default:
                throw new Error("Invalid email type specified.");
        }
        return NextResponse.json({ message: "Emails sent successfully." }, { status: 200 });

    } catch (error) {
        console.error("Failed to send email:", error);
        return NextResponse.json({ message: "Failed to send email.", error: (error as Error).message }, { status: 500 });
    }
}
