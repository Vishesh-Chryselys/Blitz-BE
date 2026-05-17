import os
import json
from langchain_aws import ChatBedrock, BedrockEmbeddings
from langchain_core.prompts import PromptTemplate
from typing import Dict, Any

def get_llm():
    return ChatBedrock(
        model_id="anthropic.claude-3-haiku-20240307-v1:0", 
        model_kwargs={"temperature": 0.1},
        region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    )

def get_embeddings():
    return BedrockEmbeddings(
        model_id="amazon.titan-embed-text-v2:0",
        region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    )

def extract_metadata_from_text(text: str, filename: str) -> Dict[str, Any]:
    """Uses LLM to extract smart metadata from the document text."""
    llm = get_llm()
    prompt = PromptTemplate.from_template(
        """You are an expert sales enablement AI. 
        Analyze the following document content (Filename: {filename}) and extract key metadata.
        Provide the output strictly as a JSON object with the following keys:
        - topic: (string) The main topic of the document
        - subtopics: (list of strings) Key subtopics covered
        - summary: (string) A concise 2-3 sentence summary of the document
        - created_by: (string) Attempt to infer the author/owner, or "Unknown" if not found
        
        Document Content (first 2000 chars):
        {text}
        
        JSON Output:"""
    )
    
    # We truncate text to avoid token limits for metadata extraction
    chain = prompt | llm
    try:
        response = chain.invoke({"filename": filename, "text": text[:2000]})
        content = response.content
        # Basic JSON cleaning
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
            "created_by": "Unknown"
        }
