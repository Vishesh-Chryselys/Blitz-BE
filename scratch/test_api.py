import requests

try:
    response = requests.get("http://127.0.0.1:8000/api/ingestion/indexed-files")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
