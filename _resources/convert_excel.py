import pandas as pd
import sys

input_file = "대방동수지분석수정_신영투자신탁제출용_251031.xlsx"
output_file = "동일수지표.csv"

try:
    # Read the excel file, assuming the relevant data might be in the first sheet
    # If there are multiple sheets, we might want to check them, but for now let's try the first one.
    df = pd.read_excel(input_file)
    
    # Save to CSV
    df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"Successfully converted {input_file} to {output_file}")
    
    # Print the first few rows to help with mapping
    print("\n--- CSV Preview ---")
    print(df.head(20).to_string())

except Exception as e:
    print(f"Error converting file: {e}")
    sys.exit(1)
