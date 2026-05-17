import os
from routers.ingestion import process_ingestion

print("Forcing local ingestion to sync Pinecone and JSON manifest...")
process_ingestion("Data", "knowledge_base")
print("Done!")
