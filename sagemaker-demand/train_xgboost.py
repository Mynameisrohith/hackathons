
import sagemaker
from sagemaker.estimator import Estimator
from sagemaker.inputs import TrainingInput
import boto3
import argparse
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main(args):
    logging.info("Starting XGBoost training job...")
    sess = sagemaker.Session()
    
    # Get the region from the session
    region = sess.boto_region_name
    
    # Get the image URI for the built-in XGBoost algorithm
    container = sagemaker.image_uris.retrieve(
        framework="xgboost",
        region=region,
        version="1.7-1" # Use a specific, stable version
    )
    logging.info(f"Using SageMaker XGBoost container: {container}")

    # Define the input data channels for SageMaker
    s3_input_train = TrainingInput(s3_data=args.train_data, content_type='csv')
    s3_input_validation = TrainingInput(s3_data=args.validation_data, content_type='csv')
    
    hyperparameters = {
        "objective": "reg:squarederror",
        "num_round": 100,
        "max_depth": 5,
        "eta": 0.2,
        "gamma": 4,
        "min_child_weight": 6,
        "subsample": 0.8,
        "verbosity": 0
    }

    estimator = Estimator(
        image_uri=container,
        role=args.role,
        instance_count=1,
        instance_type=args.instance_type,
        output_path=args.model_dir,
        sagemaker_session=sess,
        hyperparameters=hyperparameters,
        # --- COST OPTIMIZATION ---
        use_spot_instances=True,      # Use Spot Instances to save up to 90%
        max_run=3600,                 # Max training time in seconds
        max_wait=3600                 # Max time to wait for a Spot Instance
    )

    logging.info("Launching training job...")
    estimator.fit(
        {'train': s3_input_train, 'validation': s3_input_validation},
        job_name=f"{args.job_name}-xgboost"
    )
    logging.info(f"Training job complete. Model artifacts saved to {estimator.model_data}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    
    # SageMaker environment variables
    parser.add_argument('--train-data', type=str, default=os.environ.get('SM_CHANNEL_TRAIN'))
    parser.add_argument('--validation-data', type=str, default=os.environ.get('SM_CHANNEL_VALIDATION'))
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR'))
    parser.add_argument('--role', type=str, help="IAM Role ARN for SageMaker")
    parser.add_argument('--instance-type', type=str, default='ml.m5.large')
    parser.add_argument('--job-name', type=str, default='demand-forecast')

    args = parser.parse_args()
    main(args)

