from fastapi import APIRouter
from fastapi.responses import FileResponse

from models.schemas import PPTRequest
from services.ppt_builder import build_ppt

router = APIRouter()


@router.post("/")
async def generate_ppt(request: PPTRequest):
    """Generate a branded, citation-aware BLITZ PowerPoint deck."""
    file_path = build_ppt(request)
    filename = f"{request.topic[:36] or 'BLITZ deck'}.pptx"

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )
