from pinecone import Pinecone
import os
from dotenv import load_dotenv

load_dotenv()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("knowledge-engine-index")

try:
    results = index.query(
        vector=[0.0] * 1024,
        top_k=200,
        namespace="knowledge_base",
        include_metadata=True
    )
    print(f"Matches count: {len(results.get('matches', []))}")
except Exception as e:
    print(f"Error: {e}")
