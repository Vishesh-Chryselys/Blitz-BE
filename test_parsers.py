from services.document_parser import parse_document
import os

data_dir = "Data"
if not os.path.exists(data_dir):
    print("Data folder not found. Please add some files to test.")
else:
    for root, _, files in os.walk(data_dir):
        for file in files:
            file_path = os.path.join(root, file)
            print(f"Testing parser on: {file_path}")
            result = parse_document(file_path)
            
            text_preview = result.get('text', '')[:200]
            if text_preview:
                print(f"✅ Success! Extracted {len(result.get('text', ''))} characters.")
                print(f"Preview: {text_preview.replace(chr(10), ' ')}...\n")
            else:
                print("❌ Failed to extract text or file is empty.\n")
