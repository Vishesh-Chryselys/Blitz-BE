"""
Utility script to wipe ALL vectors from the Pinecone index.
Run this BEFORE re-ingesting documents to ensure a clean slate.

Usage:
    python -m scratch.clear_pinecone
"""
import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

INDEX_NAME = "knowledge-engine-index"

def clear_index():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    
    if INDEX_NAME not in pc.list_indexes().names():
        print(f"Index '{INDEX_NAME}' does not exist. Nothing to clear.")
        return
    
    index = pc.Index(INDEX_NAME)
    
    # Get current stats before deletion
    stats = index.describe_index_stats()
    total_vectors = stats.get("total_vector_count", 0)
    namespaces = stats.get("namespaces", {})
    
    print(f"\nCurrent Index Stats:")
    print(f"  Total vectors: {total_vectors}")
    print(f"  Namespaces: {list(namespaces.keys()) or ['(default)']}")
    
    if total_vectors == 0:
        print("\nIndex is already empty. Nothing to delete.")
        return
    
    print(f"\nDeleting ALL {total_vectors} vectors from index '{INDEX_NAME}'...")
    
    # Delete all vectors by namespace — if no namespaces, delete from default
    if namespaces:
        for ns in namespaces:
            print(f"  -> Deleting namespace: '{ns}'...")
            index.delete(delete_all=True, namespace=ns)
    else:
        # Default namespace (empty string)
        index.delete(delete_all=True, namespace="")
    
    # Verify
    import time
    time.sleep(3)
    stats_after = index.describe_index_stats()
    remaining = stats_after.get("total_vector_count", 0)
    
    if remaining == 0:
        print(f"\n✅ SUCCESS: All vectors deleted. Index '{INDEX_NAME}' is now empty.")
        print("   You can now re-ingest your documents from the Managed Data Sources page.")
    else:
        print(f"\n⚠️  WARNING: {remaining} vectors still remain. Try running again.")

if __name__ == "__main__":
    clear_index()
