
import argparse
import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define the LSTM Model
class LSTMRegressor(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super(LSTMRegressor, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.lstm.num_layers, x.size(0), self.lstm.hidden_size).to(x.device)
        c0 = torch.zeros(self.lstm.num_layers, x.size(0), self.lstm.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return out

def create_sequences(data, target, sequence_length):
    sequences = []
    targets = []
    for i in range(len(data) - sequence_length):
        sequences.append(data[i:i + sequence_length])
        targets.append(target[i + sequence_length])
    return np.array(sequences), np.array(targets)

if __name__ == '__main__':
    logging.info("Starting LSTM training script...")
    parser = argparse.ArgumentParser()
    
    # SageMaker args
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR'))
    parser.add_argument('--train', type=str, default=os.environ.get('SM_CHANNEL_TRAIN'))
    
    # Model hyperparameters
    parser.add_argument('--input-size', type=int, default=10) # Update based on features
    parser.add_argument('--hidden-size', type=int, default=50)
    parser.add_argument('--num-layers', type=int, default=2)
    parser.add_argument('--output-size', type=int, default=1)
    parser.add_argument('--sequence-length', type=int, default=30)
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--batch-size', type=int, default=64)
    parser.add_argument('--lr', type=float, default=0.001)

    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logging.info(f"Using device: {device}")

    train_df = pd.read_csv(os.path.join(args.train, 'train.csv'), header=None)
    y_train_df = train_df.iloc[:, 0]
    X_train_df = train_df.iloc[:, 1:]
    
    # For LSTM, we need to reshape the data into sequences
    X_train_seq, y_train_seq = create_sequences(X_train_df.values, y_train_df.values, args.sequence_length)
    
    # Correct input size based on features
    args.input_size = X_train_df.shape[1]
    
    X_train_tensor = torch.from_numpy(X_train_seq).float().to(device)
    y_train_tensor = torch.from_numpy(y_train_seq).float().view(-1, 1).to(device)

    train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)

    model = LSTMRegressor(args.input_size, args.hidden_size, args.num_layers, args.output_size).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)

    logging.info("Training LSTM model...")
    for epoch in range(args.epochs):
        for sequences, labels in train_loader:
            outputs = model(sequences)
            loss = criterion(outputs, labels)
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
        logging.info(f'Epoch [{epoch+1}/{args.epochs}], Loss: {loss.item():.4f}')
    
    logging.info("Model training complete.")
    
    model_path = os.path.join(args.model_dir, "model.pth")
    torch.save(model.state_dict(), model_path)
    logging.info(f"Model saved to {model_path}")
