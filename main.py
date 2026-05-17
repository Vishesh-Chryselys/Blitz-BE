from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, ingestion, ppt_gen
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Chryselys Hackathon - AI Knowledge Engine",
    description="Backend API for Sales Enablement AI Knowledge Engine",
    version="1.0.0"
)

# Allow Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(ingestion.router, prefix="/api/ingestion", tags=["Ingestion"])
app.include_router(ppt_gen.router, prefix="/api/ppt", tags=["PPT Generation"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "AI Knowledge Engine is running"}
