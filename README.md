# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment Setup

To run this project, you will need to set up a few environment variables for external services. Create a `.env.local` file in the root of your project and add the variables as described below.

### Google AI (Vertex AI & Gemini) Setup

This project uses Google's Generative AI models for its AI-powered features. To enable these, you need to provide an API key. The application uses the `GEMINI_API_KEY` environment variable, which is the standard name used by the underlying SDK for keys from both **Vertex AI** and **Google AI Studio**.

You can get an API key from either source:

1.  **Generate an API key**:
    *   **For Vertex AI (Recommended for Production):** Go to the [Credentials page](https://console.cloud.google.com/apis/credentials) in your Google Cloud project, create an API key, and ensure the Vertex AI API is enabled.
    *   **For Google AI Studio (for Prototyping):** Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to generate your key.
2.  **Add the key** to your `.env.local` file under the `GEMINI_API_KEY` variable name:
    ```
    # Your Google AI API key from Vertex AI or Google AI Studio
    GEMINI_API_KEY="your-google-ai-api-key"
    ```

### Google Maps API Setup

The application uses the Google Maps Places API for dealer discovery and address autocompletion.

1.  **Enable the Maps JavaScript API and Places API** in your [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview).
2.  **Add your API key** to your `.env.local` file:
    ```
    # Your public Google Maps API Key
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
    ```

### Email Notification Setup

This project uses **Nodemailer** to send emails for order notifications through a Next.js API route. To enable this, you need to configure environment variables for the email service.

1.  **Add the following variables** to your `.env.local` file, replacing the placeholder values with your actual email provider credentials:

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

#### Using Gmail for Development

If you are using a Gmail account, it is highly recommended to use an **"App Password"** for `EMAIL_PASS`, not your regular Google account password. You can generate one here:

- [Google App Passwords](https://myaccount.google.com/apppasswords)

This provides a more secure way to grant access to your application. Your app is now configured to use these variables to send emails automatically when orders are created or updated.

### Razorpay Payment Gateway Setup

This project supports Razorpay for Card and UPI payments. To enable it, you need to add your Razorpay keys to your environment variables.

1.  **Add your Razorpay keys** to the `.env.local` file:
    ```
    # This is your public Key ID, used on the client-side
    NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_RxKo8TrmasNC0l"
    
    # This is your secret key, for server-side use only
    RAZORPAY_SECRET="w6tHdOPN9jAqs8Ho5cYow6rN"
    ```
2. **Important**: The current implementation uses a client-side only flow for demonstration purposes with the public key. For a production environment, you **must** create a backend API endpoint to securely create a Razorpay Order and verify the payment signature using your `RAZORPAY_SECRET`.
