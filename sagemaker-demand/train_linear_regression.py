
import argparse
import os
import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

if __name__ == '__main__':
    logging.info("Starting Linear Regression training script...")
    parser = argparse.ArgumentParser()

    # SageMaker environment variables
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR'))
    parser.add_argument('--train', type=str, default=os.environ.get('SM_CHANNEL_TRAIN'))
    
    args = parser.parse_args()

    logging.info(f"Loading training data from {args.train}/train.csv")
    train_data = pd.read_csv(os.path.join(args.train, 'train.csv'), header=None)

    # Target is the first column
    y_train = train_data.iloc[:, 0]
    X_train = train_data.iloc[:, 1:]

    logging.info("Training Linear Regression model...")
    model = LinearRegression()
    model.fit(X_train, y_train)
    logging.info("Model training complete.")

    model_path = os.path.join(args.model_dir, "model.joblib")
    logging.info(f"Saving model to {model_path}")
    joblib.dump(model, model_path)
    logging.info("Model saved successfully.")
