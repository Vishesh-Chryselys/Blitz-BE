"""
Shared POC Lookup Table for Chryselys Sales Enablement Engine.

This is used in TWO places:
  1. routers/ingestion.py  — at ingestion time to tag stored vectors
  2. services/agent.py     — at query time to dynamically resolve POCs even for
                             documents ingested before this feature existed.

Update POC_LOOKUP whenever team assignments change.
Keys are lowercase topic keywords or client/folder name segments.
"""

# -----------------------------------------------------------------------
# POC LOOKUP TABLE — update this as team assignments change
# -----------------------------------------------------------------------
POC_LOOKUP = {
    # By capability / topic area
    "commercial analytics": "Vikas or Satya",
    "competitive intelligence": "Kamakshi",
    "data science": "Arnav",
    "field force excellence": "Kalyan",
    "forecasting": "Sekhar",
    "market access": "Gaurav",
    # By client name / folder name
    "stemline": "Gaurav",
    "sandoz": "Kalyan",
    "nvs": "Satya",
    "novartis": "Satya",
}


def resolve_poc(llm_extracted_pocs: str, topic: str, client_name: str) -> str:
    """
    Merges POC names from three sources (deduplicated):
      1. Names extracted by the LLM directly from document text.
      2. Topic-based POC lookup (e.g., 'Data Science' -> 'Arnav').
      3. Client-folder-based POC lookup (e.g., 'Stemline' -> 'Gaurav').

    Returns a comma-separated string, e.g. "Arnav, Gaurav".
    Falls back to "Unknown" if nothing is found.
    """
    found = set()

    # Source 1: LLM-extracted names from the document
    if llm_extracted_pocs and llm_extracted_pocs.lower() not in ("unknown", "none", "", "not found"):
        for name in llm_extracted_pocs.split(","):
            name = name.strip()
            if name:
                found.add(name)

    # Source 2: Topic keyword match
    topic_lower = (topic or "").lower()
    for key, poc in POC_LOOKUP.items():
        if key in topic_lower:
            found.add(poc)
            break

    # Source 3: Client / folder name match
    client_lower = (client_name or "").lower()
    for key, poc in POC_LOOKUP.items():
        if key in client_lower:
            found.add(poc)
            break

    return ", ".join(sorted(found)) if found else "Unknown"
