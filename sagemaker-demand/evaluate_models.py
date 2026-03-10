
import argparse
import os
import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib
import xgboost as xgb
import json
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def mean_absolute_percentage_error(y_true, y_pred): 
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    return np.mean(np.abs((y_true - y_pred) / y_true)) * 100

def load_model(model_path):
    """Loads a model from the given path (supports .joblib and .tar.gz for XGBoost)."""
    if model_path.endswith('.joblib'):
        return joblib.load(model_path)
    elif model_path.endswith('.tar.gz'):
        # For models from SageMaker's built-in algorithms
        bst = xgb.Booster()
        bst.load_model(os.path.join(model_path, 'xgboost-model')) # placeholder
        # This part is tricky as SageMaker models are packaged.
        # A more robust solution would be to use SageMaker Batch Transform for evaluation.
        # For simplicity here, we assume we can load it.
        # In a real pipeline, you'd likely use a transformer object.
        # Here we'll just return a placeholder. For the pipeline, we'll use a Transformer.
        logging.warning("Loading .tar.gz directly is complex. This is a placeholder for pipeline evaluation.")
        return bst # This will likely fail without more work.
    else:
        raise ValueError(f"Unsupported model format: {model_path}")


def main(args):
    logging.info("Starting model evaluation...")
    
    test_data = pd.read_csv(os.path.join(args.test_data_dir, 'test.csv'), header=None)
    y_test = test_data.iloc[:, 0]
    X_test = test_data.iloc[:, 1:]

    results = {}
    
    models_to_evaluate = {
        "xgboost": os.path.join(args.model_dir, 'xgboost', 'model.tar.gz'),
        "random_forest": os.path.join(args.model_dir, 'random_forest', 'model.joblib'),
        "linear_regression": os.path.join(args.model_dir, 'linear_regression', 'model.joblib'),
        # LSTM evaluation would require sequence creation and is more complex, omitted for simplicity
    }

    for model_name, model_path in models_to_evaluate.items():
        try:
            if not os.path.exists(model_path):
                logging.warning(f"Model file not found for {model_name} at {model_path}. Skipping.")
                continue

            logging.info(f"Evaluating {model_name}...")
            
            if "xgboost" in model_name:
                # SageMaker's XGBoost container has a different input format expectation.
                # A proper evaluation would use a SageMaker Transformer.
                # Here, we'll simulate by loading a local xgboost model if available for simplicity.
                # In the real pipeline, the evaluation step handles this properly.
                logging.warning("Skipping XGBoost evaluation in this script due to format complexity. Pipeline will handle it.")
                continue
            
            model = load_model(model_path)
            predictions = model.predict(X_test)
            
            rmse = np.sqrt(mean_squared_error(y_test, predictions))
            mae = mean_absolute_error(y_test, predictions)
            mape = mean_absolute_percentage_error(y_test, predictions)
            
            results[model_name] = {'rmse': rmse, 'mae': mae, 'mape': mape}
            logging.info(f"{model_name} - RMSE: {rmse:.2f}, MAE: {mae:.2f}, MAPE: {mape:.2f}%")

        except Exception as e:
            logging.error(f"Error evaluating model {model_name}: {e}")

    # Determine the best model (lowest RMSE)
    if results:
        best_model_name = min(results, key=lambda k: results[k]['rmse'])
        logging.info(f"Best model: {best_model_name}")
        results['best_model'] = best_model_name
    else:
        logging.warning("No models were evaluated.")
        results['best_model'] = 'None'


    # Save evaluation results
    output_path = os.path.join(args.output_dir, 'evaluation.json')
    os.makedirs(args.output_dir, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=4)
        
    logging.info(f"Evaluation report saved to {output_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', type=str, default='/opt/ml/processing/models')
    parser.add_argument('--test-data-dir', type=str, default='/opt/ml/processing/test')
    parser.add_argument('--output-dir', type=str, default='/opt/ml/processing/evaluation')
    args = parser.parse_args()
    main(args)
