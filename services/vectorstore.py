import os
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from services.llm import get_embeddings
from langchain_core.documents import Document
from typing import List

INDEX_NAME = "knowledge-engine-index"

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

def get_vectorstore():
    # Ensure index exists
    init_pinecone()
    embeddings = get_embeddings()
    return PineconeVectorStore(index_name=INDEX_NAME, embedding=embeddings)

def upsert_documents(documents: List[Document]):
    vectorstore = get_vectorstore()
    vectorstore.add_documents(documents)
    print(f"Upserted {len(documents)} document chunks to Pinecone.")
