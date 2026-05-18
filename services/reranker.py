import os
from functools import lru_cache
from typing import List, Dict
import boto3

# Cohere rerank-v3.5 hosted on Bedrock. Override via env if your account uses a
# different region/model arn (e.g. us-west-2 for early access).
RERANK_REGION = os.getenv("BEDROCK_RERANK_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
RERANK_MODEL_ID = os.getenv("BEDROCK_RERANK_MODEL_ID", "cohere.rerank-v3-5:0")


@lru_cache(maxsize=1)
def _get_rerank_client():
    return boto3.client("bedrock-agent-runtime", region_name=RERANK_REGION)


def _document_to_rerank_text(doc: dict, max_chars: int = 1800) -> str:
    """Flatten a retrieved doc into the single text blob the reranker scores."""
    meta = doc.get("metadata", {}) or {}
    header = (
        f"Client: {meta.get('client_name', 'N/A')} | "
        f"Brand: {meta.get('brand', 'N/A')} | "
        f"Topic: {meta.get('topic', 'N/A')}\n"
        f"Summary: {meta.get('summary', '')}\n"
        f"Business Objective: {meta.get('business_objective', '')}\n"
        f"Key Outcome: {meta.get('key_outcome', '')}\n"
        f"---\n"
    )
    body = (doc.get("content") or "")[: max(0, max_chars - len(header))]
    return header + body


def rerank_documents(query: str, docs: List[dict], top_n: int = 12) -> List[dict]:
    """Rerank candidate docs against the query using Bedrock-hosted Cohere rerank.

    Returns the docs reordered by relevance, each with a 'rerank_score' added to
    its metadata. On any failure the original list is returned unchanged so the
    pipeline keeps working without rerank.
    """
    if not docs:
        return docs

    try:
        client = _get_rerank_client()
        sources = [
            {
                "type": "INLINE",
                "inlineDocumentSource": {
                    "type": "TEXT",
                    "textDocument": {"text": _document_to_rerank_text(d)},
                },
            }
            for d in docs
        ]

        model_arn = f"arn:aws:bedrock:{RERANK_REGION}::foundation-model/{RERANK_MODEL_ID}"
        response = client.rerank(
            queries=[{"type": "TEXT", "textQuery": {"text": query}}],
            sources=sources,
            rerankingConfiguration={
                "type": "BEDROCK_RERANKING_MODEL",
                "bedrockRerankingConfiguration": {
                    "modelConfiguration": {"modelArn": model_arn},
                    "numberOfResults": min(top_n, len(docs)),
                },
            },
        )

        results = response.get("results", [])
        reranked: List[dict] = []
        for r in results:
            idx = r.get("index")
            score = r.get("relevanceScore", 0.0)
            if idx is None or idx >= len(docs):
                continue
            doc = docs[idx]
            doc.setdefault("metadata", {})["rerank_score"] = float(score)
            reranked.append(doc)

        if not reranked:
            return docs
        return reranked
    except Exception as e:
        print(f"Bedrock rerank failed, falling back to original order: {e}")
        return docs
