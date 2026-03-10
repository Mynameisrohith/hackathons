
import sagemaker
from sagemaker.predictor import Predictor
from sagemaker.serializers import CSVSerializer
from sagemaker.deserializers import CSVDeserializer
import boto3
import argparse
import os
import logging
import pandas as pd
import json
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main(args):
    logging.info("Starting Batch Prediction Job...")
    
    sess = sagemaker.Session()
    
    # This assumes the model was registered or its name is known.
    # In a real pipeline, the model name would be passed from the training step.
    # For this script, we assume the best model is named 'demand-forecast-xgboost-best'
    model_name = args.model_name
    
    logging.info(f"Creating a Batch Transform job for model: {model_name}")
    
    # Create a transformer for the batch prediction job
    transformer = sagemaker.transformer.Transformer(
        model_name=model_name,
        instance_count=1,
        instance_type='ml.m5.large',
        output_path=args.output_path,
        strategy='MultiRecord',
        assemble_with='Line',
        accept='text/csv'
    )
    
    # Start the Batch Transform job
    transformer.transform(
        data=args.input_data,
        content_type='text/csv',
        split_type='Line'
    )
    
    transformer.wait()
    logging.info(f"Batch Transform job finished. Predictions are in {transformer.output_path}")

    # --- Post-processing (Simulated) ---
    # In a real scenario, you'd download the output from S3.
    # For this student-friendly example, we'll generate a dummy JSON output
    # to demonstrate the file that gets uploaded to Firebase.
    logging.info("Simulating post-processing and generating predictions.json...")
    
    # This part should be replaced with actual S3 download and parsing
    dummy_products = ["P123", "P456", "P789"]
    predictions_output = []
    
    for product_id in dummy_products:
        # Simulate some prediction data
        base_demand = hash(product_id) % 50 + 10
        predicted_demand_7d = sum([base_demand + (i % 5) - 2 for i in range(7)])
        predicted_demand_30d = sum([base_demand + (i % 5) - 2 for i in range(30)])
        
        predictions_output.append({
            "productId": product_id,
            "predictedDemand7d": int(predicted_demand_7d),
            "predictedDemand30d": int(predicted_demand_30d),
            "stockoutRisk": round(np.random.uniform(0.05, 0.8), 2),
            "confidenceScore": round(np.random.uniform(0.85, 0.98), 2),
            "prediction_date": datetime.now().isoformat()
        })
        
    output_file = 'predictions.json'
    with open(output_file, 'w') as f:
        json.dump(predictions_output, f, indent=4)
        
    logging.info(f"Dummy predictions saved to {output_file}. This file should be uploaded to Firebase.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    
    parser.add_argument('--model-name', type=str, required=True, help="Name of the trained SageMaker model.")
    parser.add_argument('--input-data', type=str, required=True, help="S3 URI for the input data for prediction.")
    parser.add_argument('--output-path', type=str, required=True, help="S3 URI to save the prediction output.")

    args = parser.parse_args()
    # For simulation, we add a dummy numpy import
    import numpy as np
    main(args)
