import os
import time
from functools import lru_cache
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from services.llm import get_embeddings
from langchain_core.documents import Document
from typing import List

INDEX_NAME = "knowledge-engine-index"

@lru_cache(maxsize=1)
def init_pinecone():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    if INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=INDEX_NAME,
            dimension=1024, # Titan Embeddings v2 dimension
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    return pc

@lru_cache(maxsize=8)
def get_vectorstore(namespace: str = "default"):
    # Ensure index exists
    init_pinecone()
    embeddings = get_embeddings()
    return PineconeVectorStore(index_name=INDEX_NAME, embedding=embeddings, namespace=namespace)

import time

def upsert_documents(documents: List[Document], namespace: str = "default"):
    vectorstore = get_vectorstore(namespace=namespace)
    batch_size = 100
    total = len(documents)
    print(f"Upserting {total} document chunks to Pinecone in namespace '{namespace}' using batch size {batch_size}...")
    
    for i in range(0, total, batch_size):
        batch = documents[i:i + batch_size]
        print(f"  -> Upserting batch {i//batch_size + 1}/{(total + batch_size - 1)//batch_size} (chunks {i} to {min(i + batch_size, total)})...")
        try:
            vectorstore.add_documents(batch)
            print(f"  [OK] Batch {i//batch_size + 1} upserted successfully.")
        except Exception as e:
            print(f"  [RETRY] Batch {i//batch_size + 1} failed: {e}. Retrying in 5 seconds...")
            time.sleep(5)
            vectorstore.add_documents(batch)
            print(f"  [OK] Batch {i//batch_size + 1} upserted successfully after retry.")
        
        # Gentle rate-limiting between Bedrock embedding calls
        time.sleep(0.5)
        
    print(f"Upserted all {total} document chunks to Pinecone inside namespace: {namespace}.")
