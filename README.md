# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Email Notification Setup

This project uses **Nodemailer** to send emails for order notifications through a Next.js API route. To enable this, you need to configure environment variables for the email service.

1.  **Create a `.env.local` file** in the root of your project if it doesn't already exist.
2.  **Add the following variables** to the `.env.local` file, replacing the placeholder values with your actual email provider credentials:

    ```
    # Your email service username (e.g., your Gmail address)
    EMAIL_USER="your-email@example.com"
    
    # Your email service password or app-specific password
    EMAIL_PASS="your-app-password"

    # The admin email address to receive order notifications
    ADMIN_EMAIL="your-admin-email@example.com"

    # The super admin email address to also receive new order notifications
    SUPER_ADMIN_EMAIL="drohith7080@gmail.com"
    ```

### Using Gmail for Development

If you are using a Gmail account, it is highly recommended to use an **"App Password"** for `EMAIL_PASS`, not your regular Google account password. You can generate one here:

- [Google App Passwords](https://myaccount.google.com/apppasswords)

This provides a more secure way to grant access to your application. Your app is now configured to use these variables to send emails automatically when orders are created or updated.

### Razorpay Payment Gateway Setup

This project supports Razorpay for Card and UPI payments. To enable it, you need to add your Razorpay keys to your environment variables.

1.  **Create a `.env.local` file** if it doesn't already exist.
2.  **Add your Razorpay keys** to the `.env.local` file:
    ```
    # This is your public Key ID, used on the client-side
    NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_RxKo8TrmasNC0l"
    
    # This is your secret key, for server-side use only
    RAZORPAY_SECRET="w6tHdOPN9jAqs8Ho5cYow6rN"
    ```
3. **Important**: The current implementation uses a client-side only flow for demonstration purposes with the public key. For a production environment, you **must** create a backend API endpoint to securely create a Razorpay Order and verify the payment signature using your `RAZORPAY_SECRET`.
