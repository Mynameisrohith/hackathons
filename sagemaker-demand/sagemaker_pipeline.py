
import sagemaker
from sagemaker.processing import ScriptProcessor, ProcessingInput, ProcessingOutput
from sagemaker.workflow.steps import ProcessingStep
from sagemaker.estimator import Estimator
from sagemaker.inputs import TrainingInput
from sagemaker.workflow.steps import TrainingStep
from sagemaker.workflow.pipeline import Pipeline
import boto3
import os
import logging
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_sagemaker_role(role_name="RetailSpark-SageMakerExecutionRole"):
    """
    Retrieves the IAM role ARN for SageMaker.
    If it doesn't exist, it prints an error.
    """
    try:
        iam = boto3.client('iam')
        role_arn = iam.get_role(RoleName=role_name)['Role']['Arn']
        logging.info(f"Found SageMaker execution role: {role_arn}")
        return role_arn
    except iam.exceptions.NoSuchEntityException:
        logging.error(f"IAM Role '{role_name}' not found.")
        logging.error("Please run the `aws cloudformation create-stack ...` command from the README to create it.")
        exit(1)

def main():
    sagemaker_session = sagemaker.Session()
    bucket = sagemaker_session.default_bucket() # Or use your specific bucket from the CloudFormation output
    role_arn = get_sagemaker_role()
    region = sagemaker_session.boto_region_name
    
    # A unique name for this pipeline execution
    pipeline_name = f"RetailSpark-Demand-Forecast-Pipeline-{int(time.time())}"
    
    # --- Step 1: Data Preprocessing ---
    
    script_preprocessor = ScriptProcessor(
        command=['python3'],
        image_uri=f"683313144549.dkr.ecr.{region}.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3", # SKLearn image
        role=role_arn,
        instance_count=1,
        instance_type='ml.t3.medium',
        base_job_name='retail-spark-preprocessing'
    )
    
    step_process = ProcessingStep(
        name="DataPreprocessing",
        processor=script_preprocessor,
        inputs=[
            ProcessingInput(
                source='data/raw/sales_data.csv', # Path to your raw data in S3
                destination='/opt/ml/processing/input'
            )
        ],
        outputs=[
            ProcessingOutput(output_name="train_data", source='/opt/ml/processing/train', destination=f's3://{bucket}/data/train'),
            ProcessingOutput(output_name="test_data", source='/opt/ml/processing/test', destination=f's3://{bucket}/data/test')
        ],
        code='data_preprocessing.py'
    )
    
    # --- Step 2: Model Training (XGBoost) ---
    
    model_path = f"s3://{bucket}/models"
    
    xgboost_image_uri = sagemaker.image_uris.retrieve(
        framework="xgboost",
        region=region,
        version="1.7-1"
    )

    xgb_estimator = Estimator(
        image_uri=xgboost_image_uri,
        role=role_arn,
        instance_count=1,
        instance_type='ml.m5.large',
        output_path=model_path,
        sagemaker_session=sagemaker_session,
        hyperparameters={
            "objective": "reg:squarederror",
            "num_round": 100,
        },
        use_spot_instances=True,
        max_run=3600,
        max_wait=3600,
        base_job_name='retail-spark-xgb-train'
    )
    
    step_train = TrainingStep(
        name="XGBoostTraining",
        estimator=xgb_estimator,
        inputs={
            "train": TrainingInput(
                s3_data=step_process.properties.ProcessingOutputConfig.Outputs["train_data"].S3Output.S3Uri,
                content_type="text/csv"
            ),
            "validation": TrainingInput(
                s3_data=step_process.properties.ProcessingOutputConfig.Outputs["test_data"].S3Output.S3Uri,
                content_type="text/csv"
            )
        }
    )
    
    # --- Step 3: Model Evaluation (Simplified for pipeline) ---
    
    script_evaluator = ScriptProcessor(
        command=['python3'],
        image_uri=f"683313144549.dkr.ecr.{region}.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3",
        role=role_arn,
        instance_count=1,
        instance_type='ml.t3.medium',
        base_job_name='retail-spark-evaluation'
    )

    step_evaluate = ProcessingStep(
        name="ModelEvaluation",
        processor=script_evaluator,
        inputs=[
            ProcessingInput(
                source=step_train.properties.ModelArtifacts.S3ModelArtifacts,
                destination='/opt/ml/processing/model'
            ),
            ProcessingInput(
                source=step_process.properties.ProcessingOutputConfig.Outputs["test_data"].S3Output.S3Uri,
                destination='/opt/ml/processing/test'
            )
        ],
        outputs=[
            ProcessingOutput(output_name="evaluation", source='/opt/ml/processing/evaluation', destination=f's3://{bucket}/evaluation')
        ],
        code='evaluate_models.py'
    )
    
    # --- Pipeline Assembly ---
    
    pipeline = Pipeline(
        name=pipeline_name,
        parameters=[],
        steps=[step_process, step_train, step_evaluate]
    )
    
    logging.info("Pipeline definition complete. Submitting to SageMaker...")
    pipeline.upsert(role_arn=role_arn)
    
    logging.info(f"Starting pipeline execution for '{pipeline_name}'...")
    execution = pipeline.start()
    logging.info(f"Pipeline execution started with ARN: {execution.arn}")
    
    # You can view the pipeline progress in the AWS SageMaker console.
    
if __name__ == "__main__":
    main()
