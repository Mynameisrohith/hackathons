# RetailSpark - A Full-Stack AI-Powered E-commerce Platform

Welcome to RetailSpark, a comprehensive, full-stack e-commerce SaaS platform built with Next.js, Firebase, and a powerful suite of AWS services for machine learning and data processing. This project is designed to be a robust, scalable, and cost-effective solution for modern retail, optimized for students and startups to run and experiment with locally.

## Core Architecture (Hybrid Cloud Model)

This project demonstrates a powerful hybrid cloud strategy:

-   **Frontend:** Next.js, React, TypeScript, and Tailwind CSS for a fast, modern, and responsive user experience.
-   **Backend & Auth:** Firebase Cloud Functions (Node.js/Express) and Firebase Authentication provide a secure, serverless backend and a seamless user login experience.
-   **Primary Database:** Firestore is used for storing application metadata, user data, and pre-computed AI predictions, offering real-time updates to the frontend.
-   **ML Training & Inference:** Amazon SageMaker is used for its powerful, cost-effective model training capabilities, including support for Spot Instances. The primary inference method is **batch prediction** to minimize costs, with an optional path to deploy serverless endpoints.
-   **Data Lake & Model Storage:** Amazon S3 serves as the central repository for raw training data, processed datasets, and trained model artifacts.

## Key Features

-   **AI Demand Forecasting:** A premium dashboard for admins to visualize future product demand, stockout risks, and other key metrics predicted by a SageMaker model.
-   **Cost-Optimized ML:** The architecture defaults to using SageMaker Batch Transform jobs for inference, avoiding the cost of a continuously running real-time endpoint.
-   **Full-Stack Type Safety:** End-to-end TypeScript coverage from the frontend to the Firebase backend.
-   **Enterprise-Grade Admin Panel:** A secure, role-based dashboard for managing products, orders, users, and viewing AI-driven analytics.
-   **Hybrid Data Model:** Leverages the best of both worlds—Firestore for low-latency metadata and UI state, and S3 for large-scale data and model storage.

---

## Local Development Setup

Follow these steps to get the entire full-stack application running on your local machine.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v20 or later)
-   [Python](https://www.python.org/downloads/) (v3.9 or later) and `pip`
-   [AWS CLI](https://aws.amazon.com/cli/) installed and configured with your credentials.
-   [Firebase CLI](https://firebase.google.com/docs/cli) installed and logged in.
-   An active AWS account and a Firebase project.

### 2. Environment Variable Setup

This is the most critical step. The application will not run without the correct credentials.

1.  **Create the environment file:**
    In the root of the project, rename the `.env.example` file to `.env`

2.  **Fill in the AWS Credentials:**
    Open the new `.env` file and replace the placeholder values with your actual AWS credentials.

    ```bash
    # .env

    # Your AWS Access Key ID
    AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"

    # Your AWS Secret Access Key
    AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"

    # The AWS region you are working in (e.g., us-east-1)
    AWS_REGION="us-east-1"

    # A unique name for the S3 bucket that will be created
    AWS_S3_BUCKET_NAME="your-unique-retailspark-sagemaker-bucket"

    # Leave this as is for now. It will be set after training.
    SAGEMAKER_ENDPOINT_NAME="your-sagemaker-endpoint-name"

    # Optional: Bedrock Model ID for AI Summaries
    BEDROCK_MODEL_ID="anthropic.claude-3-sonnet-20240229-v1:0"
    ```

### 3. Install Dependencies

Open two terminal windows in the project root.

-   **Terminal 1 (Frontend & General):**
    ```bash
    npm install
    ```

-   **Terminal 2 (Firebase Functions):**
    ```bash
    cd functions
    npm install
    ```

### 4. Run the Application

-   **Terminal 1 (Frontend):** Start the Next.js development server.
    ```bash
    npm run dev
    ```
    Your Next.js app will be available at `http://localhost:9002`.

-   **Terminal 2 (Backend):** Start the Firebase Functions emulator.
    ```bash
    npm run serve
    ```
    This will start the local server for your API functions, typically on port `5001`. The Next.js app is pre-configured to proxy API requests to this server.

### 5. SageMaker and Machine Learning Setup

The machine learning components are located in the `/sagemaker-demand` directory.

1.  **Install Python Dependencies:**
    ```bash
    cd sagemaker-demand
    pip install -r requirements.txt
    ```

2.  **Deploy AWS Infrastructure:**
    Use the provided CloudFormation template to create your S3 bucket and IAM roles.
    ```bash
    aws cloudformation create-stack --stack-name RetailSpark-SageMaker-Stack --template-body file://infra.yaml --capabilities CAPABILITY_IAM
    ```

3.  **Run the SageMaker Pipeline:**
    Execute the pipeline script. This will start the entire ML workflow on AWS, including data processing, model training (using Spot Instances to save costs), and evaluation.
    ```bash
    python sagemaker_pipeline.py
    ```
    This process will take some time. You can monitor the progress in the `AWS SageMaker > Training > Training Jobs` section of the AWS Console.

4.  **Run a Batch Prediction:**
    Once the training is complete and the best model is saved, run the batch prediction script. This simulates a daily or weekly job that generates forecasts.
    ```bash
    python batch_predict.py
    ```
    This script will save a `predictions.json` file in the `sagemaker-demand` directory.

5.  **Upload Predictions to Firebase:**
    Run the Node.js script to upload the batch predictions into your Firestore database so the frontend can access them.
    ```bash
    # Make sure you are in the root directory
    node scripts/upload-predictions.js
    ```

Now, when you visit the "AI Demand Forecasting" dashboard in the admin panel, it will display the predictions you just generated and uploaded.

---

## Architecture Explained

### Cost-Optimized ML Inference

Instead of deploying a 24/7 real-time SageMaker endpoint (which incurs hourly costs), our primary strategy is **batch prediction**.

1.  The `sagemaker_pipeline.py` runs on a schedule (e.g., daily via a GitHub Action or cron job).
2.  It trains the model on fresh data and selects the best performer.
3.  The `batch_predict.py` script uses this model to generate forecasts for all products for the upcoming week.
4.  These predictions are saved to a JSON file.
5.  The `upload-predictions.js` script pushes these forecasts into a `ai_reports` collection in Firestore.

When the admin dashboard loads, it simply reads the **latest pre-computed prediction** from Firestore. This is extremely fast, scalable, and costs virtually nothing in terms of ML inference.

### Upgrading to Enterprise (Real-Time)

For businesses that require instant predictions, the architecture can be easily upgraded:

1.  **Deploy a Serverless Endpoint:** In `infra.yaml`, uncomment the `SageMakerServerlessEndpoint` resource and re-deploy the CloudFormation stack.
2.  **Update the Firebase Function:** In `firebase-backend/functions/src/predictDemand.ts`, comment out the Firestore-reading logic and uncomment the `invokeSageMakerEndpoint` block.
3.  **Re-deploy the function:** `firebase deploy --only functions`

The frontend code does not need to change. This architectural flexibility allows the platform to scale from a cost-effective startup model to a high-throughput enterprise solution.
