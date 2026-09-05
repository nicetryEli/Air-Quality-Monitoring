import pandas as pd

def create_temporal_split(input_file, train_output, test_output, test_ratio=0.2):
    # 1. Read the dataset
    print("Reading and processing dataset...")
    df = pd.read_csv(input_file)
    
    # 2. Convert to datetime and sort chronologically
    # This is the most critical step for time-series forecasting
    df['datetime'] = pd.to_datetime(df['datetime'])
    df = df.sort_values(by='datetime')
    
    # 3. Split at a complete timestamp so stations from one hour stay together
    total_rows = len(df)
    timestamps = df['datetime'].drop_duplicates().sort_values().to_numpy()
    split_timestamp = timestamps[int(len(timestamps) * (1 - test_ratio))]

    # 4. Split the data
    # The first 80% of the timeline becomes Train, the last 20% becomes Test
    train_df = df[df['datetime'] < split_timestamp].copy()
    test_df = df[df['datetime'] >= split_timestamp].copy()
    
    # 5. Extract cutoff date and ranges for reporting
    cutoff_date = test_df['datetime'].min()
    train_start = train_df['datetime'].min()
    train_end = train_df['datetime'].max()
    test_start = test_df['datetime'].min()
    test_end = test_df['datetime'].max()
    
    # 6. Save the split datasets into new CSV files
    print("Saving split datasets to CSV...")
    train_df.to_csv(train_output, index=False)
    test_df.to_csv(test_output, index=False)
    
    # 7. Print summary report
    print("\nPURE TEMPORAL SPLIT COMPLETED")
    print("-" * 55)
    print(f"Original total rows: {total_rows}")
    print(f"Train dataset rows:  {len(train_df)}")
    print(f"Test dataset rows:   {len(test_df)} (Target ratio: {test_ratio*100}%)")
    print("-" * 55)
    print(f"Temporal cut-off:    {cutoff_date}")
    print(f"Train date range:    {train_start} to {train_end}")
    print(f"Test date range:     {test_start} to {test_end}")

# --- USAGE INSTRUCTIONS ---
# Ensure the file paths match your local directory structure
if __name__ == "__main__":
    create_temporal_split(
        input_file=r'dataset\training\PRSA_Beijing_AirQuality_Cleaned.csv', 
        train_output=r'dataset\training\train_data.csv', 
        test_output=r'dataset\training\test_data.csv',
        test_ratio=0.2
    )