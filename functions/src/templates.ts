
import { Order, UserProfile } from "./types";

const containerStyles = `style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;"`;
const headerStyles = `style="background-color: #3F51B5; color: white; padding: 20px; text-align: center;"`;
const contentStyles = `style="padding: 20px; line-height: 1.6;"`;
const footerStyles = `style="background-color: #f5f6fa; color: #888; padding: 15px; text-align: center; font-size: 12px;"`;
const buttonStyles = `style="background-color: #03A9F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"`;

const renderItems = (items: Order['items']) => {
    return items.map(item => `
        <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
            <img src="${item.imageUrl}" alt="${item.productName}" width="60" style="border-radius: 4px; margin-right: 15px;" />
            <div style="flex-grow: 1;">
                <p style="margin: 0; font-weight: bold;">${item.productName}</p>
                <p style="margin: 0; font-size: 14px; color: #555;">Qty: ${item.quantity}</p>
            </div>
            <p style="margin: 0; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</p>
        </div>
    `).join('');
};

export const orderConfirmationTemplate = (order: Order, user: UserProfile): string => `
<div ${containerStyles}>
    <div ${headerStyles}><h1>Order Confirmed!</h1></div>
    <div ${contentStyles}>
        <h2>Hi ${user.displayName || 'Customer'},</h2>
        <p>Thank you for your order! We've received it and are getting it ready for dispatch. Here are the details:</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <h3>Order Summary</h3>
        ${renderItems(order.items)}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <h3>Shipping To:</h3>
        <p>
            ${order.customerName}<br>
            ${order.address}<br>
            ${order.city}, ${order.pincode}
        </p>
        <h3>Dispatched From:</h3>
        <p>
            <strong>${order.dealerName}</strong><br>
            ${order.dealerAddress}
        </p>
        <p>We'll notify you again once your order has shipped.</p>
    </div>
    <div ${footerStyles}>&copy; ${new Date().getFullYear()} RetailSpark. All rights reserved.</div>
</div>
`;

export const newOrderAdminNotificationTemplate = (order: Order, user: UserProfile): string => `
<div ${containerStyles}>
    <div ${headerStyles}><h1>New Order Notification</h1></div>
    <div ${contentStyles}>
        <h2>A new order has been placed on RetailSpark.</h2>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Customer:</strong> ${user.displayName} (${user.email})</p>
        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <h3>Order Details</h3>
        ${renderItems(order.items)}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <h3>Shipping Address:</h3>
        <p>${order.customerName}, ${order.address}, ${order.city}, ${order.pincode}</p>
        <h3>Assigned Dealer:</h3>
        <p>${order.dealerName}, ${order.dealerAddress}</p>
    </div>
    <div ${footerStyles}>This is an automated notification from RetailSpark.</div>
</div>
`;

export const statusUpdateTemplate = (order: Order, user: UserProfile): string => `
<div ${containerStyles}>
    <div ${headerStyles}><h1>Your Order is ${order.deliveryStatus}!</h1></div>
    <div ${contentStyles}>
        <h2>Hi ${user.displayName || 'Customer'},</h2>
        <p>Good news! The status of your order #${order.id} has been updated to <strong>${order.deliveryStatus}</strong>.</p>
        ${order.deliveryStatus === 'Shipped' ? '<p>Your items are on their way and should arrive soon. You can view your order details in your account.</p>' : ''}
        <div style="text-align: center; margin: 20px 0;">
            <a href="#" ${buttonStyles}>View Order</a>
        </div>
    </div>
    <div ${footerStyles}>&copy; ${new Date().getFullYear()} RetailSpark. All rights reserved.</div>
</div>
`;

export const feedbackRequestTemplate = (order: Order, user: UserProfile): string => `
<div ${containerStyles}>
    <div ${headerStyles}><h1>Your Order Has Been Delivered!</h1></div>
    <div ${contentStyles}>
        <h2>Hi ${user.displayName || 'Customer'},</h2>
        <p>We see that your order #${order.id} has been successfully delivered. We hope you're enjoying your products!</p>
        <p>Would you mind taking a moment to share your feedback? Your opinion helps us and other customers.</p>
        <div style="text-align: center; margin: 20px 0;">
            <a href="#" ${buttonStyles}>Leave a Review</a>
        </div>
    </div>
    <div ${footerStyles}>&copy; ${new Date().getFullYear()} RetailSpark. All rights reserved.</div>
</div>
`;

export const cancellationNotificationTemplate = (order: Order): string => `
<div ${containerStyles}>
    <div ${headerStyles}><h1>Order Cancellation Alert</h1></div>
    <div ${contentStyles}>
        <h2>Order #${order.id} has been marked as cancelled.</h2>
        <p><strong>Customer Name:</strong> ${order.customerName}</p>
        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
        ${order.cancellationReason ? `<p><strong>Reason:</strong> ${order.cancellationReason}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <h3>Items in Order:</h3>
        ${renderItems(order.items)}
    </div>
    <div ${footerStyles}>This is an automated notification from RetailSpark.</div>
</div>
`;
