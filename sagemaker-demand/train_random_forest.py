
import argparse
import os
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

if __name__ == '__main__':
    logging.info("Starting Random Forest training script...")
    parser = argparse.ArgumentParser()

    # SageMaker environment variables
    parser.add_argument('--output-data-dir', type=str, default=os.environ.get('SM_OUTPUT_DATA_DIR'))
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR'))
    parser.add_argument('--train', type=str, default=os.environ.get('SM_CHANNEL_TRAIN'))
    
    args = parser.parse_args()

    logging.info(f"Loading training data from {args.train}/train.csv")
    training_dir = args.train
    train_data = pd.read_csv(os.path.join(training_dir, 'train.csv'), header=None)

    # The first column is the target variable ('sales_quantity')
    y_train = train_data.iloc[:, 0]
    X_train = train_data.iloc[:, 1:]

    logging.info("Training Random Forest model...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    logging.info("Model training complete.")

    # Save the trained model
    model_path = os.path.join(args.model_dir, "model.joblib")
    logging.info(f"Saving model to {model_path}")
    joblib.dump(model, model_path)
    logging.info("Model saved successfully.")
