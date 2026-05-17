import os
import sys
from dotenv import load_dotenv
load_dotenv()

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from services.vectorstore import get_vectorstore

def search_debug():
    queries = [
        "Stemline client",
        "Orserdu ORS growth drivers",
        "CONNEX program Stemline",
        "Stemline project deliverables",
        "CDK rechallenge Stemline",
    ]
    
    for query in queries:
        print(f"\n{'='*60}")
        print(f"Query: '{query}'")
        print(f"{'='*60}")
        
        for namespace in ["", "default"]:
            print(f"\n  [Namespace: '{namespace or '<shared>'}']")
            try:
                store = get_vectorstore(namespace=namespace)
                results = store.similarity_search_with_score(query, k=3)
                if not results:
                    print("  No results.")
                for doc, score in results:
                    client = doc.metadata.get('client_name', 'N/A')
                    source = doc.metadata.get('source', 'N/A')
                    print(f"  Score: {score:.4f} | Client: {client} | Source: {source}")
                    print(f"  Snippet: {doc.page_content[:120].strip()}...")
                    print()
            except Exception as e:
                print(f"  Error: {e}")

if __name__ == "__main__":
    search_debug()
