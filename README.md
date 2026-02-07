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
    ```

### Using Gmail for Development

If you are using a Gmail account, it is highly recommended to use an **"App Password"** for `EMAIL_PASS`, not your regular Google account password. You can generate one here:

- [Google App Passwords](https://myaccount.google.com/apppasswords)

This provides a more secure way to grant access to your application. Your app is now configured to use these variables to send emails automatically when orders are created or updated.
