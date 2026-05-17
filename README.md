# Chryselys Hackathon 2026 - AI Knowledge Engine

## Overview
This repository contains the backend implementation for the AI-Powered Knowledge Engine for Sales Enablement. It leverages AWS Bedrock, Pinecone (Vector DB), FastAPI, and LangGraph to provide an advanced Retrieval-Augmented Generation (RAG) system with a multi-agent architecture.

## Setup Instructions

1. **Activate the Virtual Environment**
   - Windows: `.venv\Scripts\activate`
   - Mac/Linux: `source .venv/bin/activate`

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory and add the following:
   ```env
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_DEFAULT_REGION=us-east-1
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_ENVIRONMENT=your_pinecone_env
   ```

4. **Run the Application**
   ```bash
   uvicorn main:app --reload
   ```
   The API will be accessible at `http://127.0.0.1:8000`. You can view the Swagger UI at `http://127.0.0.1:8000/docs`.
