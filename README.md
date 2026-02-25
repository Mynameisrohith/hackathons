
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment Setup

To run this project, you will need to set up a few environment variables for external services. Create a `.env.local` file in the root of your project and add the variables as described below.

### Amazon SageMaker Endpoint Setup

The AI Demand Forecasting feature requires a deployed Amazon SageMaker endpoint. You must provide the name of this endpoint in your environment variables.

**Action Required:**
1.  **Navigate to SageMaker**: Open the [Amazon SageMaker Console](https://console.aws.amazon.com/sagemaker/).
2.  **Go to Endpoints**: In the left-hand navigation pane, under the **Inference** section, click on **Endpoints**.
3.  **Copy Endpoint Name**: Find the endpoint you have deployed for this project. The status should be **InService**. Copy the full **Endpoint name**.
4.  **Configure Environment Variable**:
    *   Open your `.env.local` file.
    *   Find the `SAGEMAKER_ENDPOINT_NAME` variable and paste the name you copied:
    ```
    SAGEMAKER_ENDPOINT_NAME="your-sagemaker-endpoint-name"
    ```
    *Replace `your-sagemaker-endpoint-name` with the actual name from the SageMaker console.*

### AI Assistant (Vertex AI) Setup

This project's AI Chat Assistant uses **Vertex AI**, which requires service account authentication to work in a local development environment. When deployed to Firebase App Hosting or another Google Cloud environment, authentication is handled automatically.

**Action Required for Local Development:**
1.  **Install the Google Cloud CLI**: Follow the instructions to [install the gcloud CLI](https://cloud.google.com/sdk/docs/install).
2.  **Authenticate the CLI**: Run the following command in your terminal and follow the prompts to log in with your Google account:
    ```bash
    gcloud auth application-default login
    ```
This command creates a credentials file on your local machine that the application will automatically use for authenticating with Vertex AI, without needing an API key.

### Google Maps API Setup

The application uses the Google Maps JavaScript API, Places API, and Geocoding API for features like address autocompletion and live tracking. A valid API key is required.

**Action Required:**
1.  **Get an API Key**:
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview).
    *   Select your project (or create a new one).
    *   Go to the **APIs & Services > Credentials** page.
    *   Click **Create Credentials > API key**. Copy the key.

2.  **Enable APIs**:
    *   Go to the [API Library](https://console.cloud.google.com/apis/library).
    *   Search for and enable the following APIs for your project:
        *   **Maps JavaScript API**
        *   **Places API**
        *   **Geocoding API**

3.  **Configure Environment Variable**:
    *   Create a file named `.env.local` in the root of your project (if it doesn't exist).
    *   Add your API key to this file:
    ```
    # Your public Google Maps API Key
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
    ```
    *Replace `YOUR_GOOGLE_MAPS_API_KEY` with the key you copied in Step 1.*

4.  **Troubleshooting the `ApiTargetBlockedMapError`**:
    *   This common error means your API key is either invalid or restricted in a way that blocks your application.
    *   **Check API Restrictions**: In the Cloud Console Credentials page, click on your API key. Under **Application restrictions**, ensure that you have either selected "None" (not recommended for production) or have added your development URL (e.g., `localhost:9002` or your specific port) to the list of allowed "HTTP referrers". For production, you will need to add your deployed application's domain.
    *   **Check API Enablement**: Double-check that all three APIs listed in Step 2 are enabled for your project. It can sometimes take a few minutes for the changes to propagate after enabling an API.

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
