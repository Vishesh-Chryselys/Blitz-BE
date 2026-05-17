import os
import sys
from dotenv import load_dotenv
load_dotenv()

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from routers.ingestion import process_ingestion

def test_ingestion():
    # Ingest ALL of Data/ into the shared "" namespace (the corporate knowledge base)
    # This ensures Stemline docs are discoverable by everyone
    folder = r"c:\Users\ShriyansJain\Blitz-BE\Data\Project Deliverables Repository"
    namespace = ""  # Shared corporate namespace
    
    print(f"Triggering synchronous ingestion for '{folder}' -> namespace '{namespace or '<shared>'}' ...")
    try:
        process_ingestion(folder, namespace=namespace)
        print("\nIngestion complete!")
    except Exception as e:
        print(f"\n[ERROR] Ingestion crashed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ingestion()
