import os
import json
from functools import lru_cache
from langchain_aws import ChatBedrock, BedrockEmbeddings
from langchain_core.prompts import PromptTemplate
from typing import Dict, Any

@lru_cache(maxsize=1)
def get_llm():
    """Cheap, fast model used for ingestion metadata extraction, history summarization, and query rewrites."""
    return ChatBedrock(
        model_id=os.getenv("BEDROCK_UTILITY_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0"),
        model_kwargs={"temperature": 0.1},
        region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    )

@lru_cache(maxsize=1)
def get_generator_llm():
    """High-quality model used only for the final answer generation in the chat agent."""
    return ChatBedrock(
        model_id=os.getenv("BEDROCK_GENERATOR_MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0"),
        model_kwargs={"temperature": 0.2, "max_tokens": 2000},
        region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    )

@lru_cache(maxsize=1)
def get_embeddings():
    return BedrockEmbeddings(
        model_id="amazon.titan-embed-text-v2:0",
        region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    )

def extract_metadata_from_text(text: str, filename: str) -> Dict[str, Any]:
    """Uses LLM to extract structured project intelligence metadata from the document text."""
    llm = get_llm()
    prompt = PromptTemplate.from_template(
        """You are an expert sales enablement AI for Chryselys, a pharma analytics consulting firm.
        Analyze the following document content (Filename: {filename}) and extract structured project intelligence metadata.
        Provide the output strictly as a JSON object with the following keys:
        - topic: (string) The main topic or capability area of the document
        - subtopics: (list of strings) Key subtopics covered
        - summary: (string) A concise 2-3 sentence summary of the document
        - client_project: (string) The pharma client this project was done for (e.g., "Stemline", "Pfizer"). Write "Internal" if it is a Chryselys internal capability document.
        - brand: (string) The drug/product brand name if mentioned (e.g., "Elzonris", "Nemplera"), else "N/A"
        - pocs: (string) Names of Point of Contacts or authors mentioned in the document, else "Unknown"
        - business_objective: (string) What was the core business problem or objective this work addressed?
        - approach: (string) What analytical or strategic approach/methodology was used?
        - datasets_used: (string) What data sources or datasets were referenced or used?
        - key_outcome: (string) What were the key results, outputs, or outcomes delivered?
        - case_study: (string) Is there a case study or success story referenced? If yes, describe briefly. Else "None"
        - timeline_pricing: (string) Any mention of timeline, project duration, or pricing. Else "Not mentioned"
        - created_by: (string) Attempt to infer the author/owner from the document, or "Unknown" if not found
        
        Document Content (first 3000 chars):
        {text}
        
        JSON Output:"""
    )
    
    chain = prompt | llm
    try:
        response = chain.invoke({"filename": filename, "text": text[:3000]})
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
            
        metadata = json.loads(content)
        return metadata
    except Exception as e:
        print(f"Failed to extract metadata for {filename}: {e}")
        return {
            "topic": "General",
            "subtopics": [],
            "summary": "No summary available.",
            "client_project": "Unknown",
            "brand": "N/A",
            "pocs": "Unknown",
            "business_objective": "Not extracted",
            "approach": "Not extracted",
            "datasets_used": "Not extracted",
            "key_outcome": "Not extracted",
            "case_study": "None",
            "timeline_pricing": "Not mentioned",
            "created_by": "Unknown"
        }

