
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import argparse
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def create_time_features(df, date_col='date'):
    """Creates time series features from a datetime index."""
    df[date_col] = pd.to_datetime(df[date_col])
    df['day_of_week'] = df[date_col].dt.dayofweek
    df['month'] = df[date_col].dt.month
    df['day_of_year'] = df[date_col].dt.dayofyear
    df['week_of_year'] = df[date_col].dt.isocalendar().week.astype(int)
    return df

def create_lag_features(df, lag_days, col='sales_quantity'):
    """Creates lag features for a given column."""
    for lag in lag_days:
        df[f'{col}_lag_{lag}'] = df.groupby('product_id')[col].shift(lag)
    return df

def create_rolling_features(df, windows, col='sales_quantity'):
    """Creates rolling mean features for a given column."""
    for window in windows:
        df[f'{col}_roll_mean_{window}'] = df.groupby('product_id')[col].shift(1).rolling(window).mean()
    return df

def main(args):
    logging.info("Starting data preprocessing...")
    
    input_data_path = os.path.join(args.input_dir, 'sales_data.csv')
    logging.info(f"Reading data from {input_data_path}")
    df = pd.read_csv(input_data_path)

    # 1. Handle missing values (simple forward fill)
    df.fillna(method='ffill', inplace=True)
    df.fillna(0, inplace=True) # Fill any remaining NaNs

    # 2. Encode categorical features
    # Using simple label encoding for this example.
    # For a production system, OneHotEncoder is often better.
    le_promo = LabelEncoder()
    df['promotions_encoded'] = le_promo.fit_transform(df['promotions'])

    # 3. Create time-based features
    df = create_time_features(df)
    
    # 4. Create lag and rolling window features
    df = create_lag_features(df, lag_days=[7, 14, 21, 28])
    df = create_rolling_features(df, windows=[7, 14, 30])

    # Drop original categorical and date columns after feature engineering
    df.drop(columns=['date', 'promotions'], inplace=True)
    
    # Re-fill NaNs created by lag/rolling features
    df.fillna(0, inplace=True)

    logging.info("Feature engineering complete.")
    logging.info(f"Final columns: {df.columns.tolist()}")

    # 5. Split data into training and testing sets (time-based)
    df_sorted = df.sort_values(by='day_of_year')
    train_df, test_df = train_test_split(df_sorted, test_size=0.2, shuffle=False)

    logging.info(f"Training set shape: {train_df.shape}")
    logging.info(f"Test set shape: {test_df.shape}")

    # 6. Save processed data to the output directories
    os.makedirs(args.output_train_dir, exist_ok=True)
    os.makedirs(args.output_test_dir, exist_ok=True)
    
    train_df.to_csv(os.path.join(args.output_train_dir, 'train.csv'), index=False, header=False)
    test_df.to_csv(os.path.join(args.output_test_dir, 'test.csv'), index=False, header=False)

    logging.info(f"Processed data saved to {args.output_train_dir} and {args.output_test_dir}")
    logging.info("Data preprocessing finished successfully.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input-dir', type=str, default='/opt/ml/processing/input')
    parser.add_argument('--output-train-dir', type=str, default='/opt/ml/processing/train')
    parser.add_argument('--output-test-dir', type=str, default='/opt/ml/processing/test')
    args = parser.parse_args()
    main(args)
