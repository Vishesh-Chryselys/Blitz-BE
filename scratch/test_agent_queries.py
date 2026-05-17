import os
import sys
from dotenv import load_dotenv
load_dotenv()

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from services.agent import run_agent

def test_queries():
    queries = [
        "what information do you have on stemline",
        "what information do you have about patient finder project"
    ]
    
    session_id = "session_TEST_123"
    
    for query in queries:
        print(f"\n{'='*80}")
        print(f"USER: {query}")
        print(f"{'='*80}")
        
        try:
            response = run_agent(query, session_id=session_id)
            print(f"\nAIVY: {response.get('final_answer', 'No answer generated.')}")
            
            # Print retrieved docs for debugging
            docs = response.get("retrieved_docs", [])
            if docs:
                print("\nSources referenced:")
                for i, doc in enumerate(docs):
                    metadata = doc.get("metadata", {})
                    client = metadata.get("client_name", "N/A")
                    source = metadata.get("source", "Unknown")
                    print(f" [{i+1}] Client: {client} | Source: {source}")
        except Exception as e:
            print(f"Error running agent: {e}")

if __name__ == "__main__":
    test_queries()
