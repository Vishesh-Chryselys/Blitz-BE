import os
from dotenv import load_dotenv
load_dotenv()
from pinecone import Pinecone
from services.vectorstore import INDEX_NAME

def diag():
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("PINECONE_API_KEY not found in environment!")
        return
        
    pc = Pinecone(api_key=api_key)
    print(f"Connecting to Pinecone index: {INDEX_NAME}...")
    
    try:
        index = pc.Index(INDEX_NAME)
        stats = index.describe_index_stats()
        print("\n=== PINECONE INDEX STATS ===")
        print(stats)
        
        print("\n=== NAMESPACES ===")
        for ns_name, ns_stats in stats.namespaces.items():
            print(f"- Namespace: '{ns_name}' | Vector Count: {ns_stats.vector_count}")
            
            # Fetch a sample vector to extract metadata source names
            try:
                # Query with dummy vector to list some contents
                dummy_vector = [0.0] * 1024
                query_res = index.query(
                    vector=dummy_vector,
                    top_k=20,
                    namespace=ns_name,
                    include_metadata=True
                )
                print(f"  Sample files in namespace '{ns_name}':")
                seen_sources = set()
                for match in query_res.matches:
                    source = match.metadata.get("source") if match.metadata else None
                    if source:
                        seen_sources.add(source)
                for src in seen_sources:
                    print(f"    * {src}")
            except Exception as e:
                print(f"  Error fetching sample for namespace '{ns_name}': {e}")
                
    except Exception as e:
        print(f"Error describing index: {e}")

if __name__ == "__main__":
    diag()
