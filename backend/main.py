import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.genai import errors as genai_errors

import gemini_service
from gemini_service import GeminiNotConfigured, GeminiResponseError
from models import AnswerRequest, AnswerResponse, DownloadRequest
from security import rate_limit, verify_app_password
from text_cleanup import clean_math_artifacts, remove_duplicate_option_labels
from word_export import build_mcq_docx

app = FastAPI(title="MCQ Answer & Explanation API")

origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/answer", response_model=AnswerResponse, dependencies=[Depends(verify_app_password), Depends(rate_limit)])
async def answer(request: AnswerRequest) -> AnswerResponse:
    questions = [
        remove_duplicate_option_labels(clean_math_artifacts(q.strip()))
        for q in request.questions
        if q.strip()
    ]
    if not questions:
        raise HTTPException(status_code=400, detail="No questions provided.")

    try:
        results = await gemini_service.get_mcq_answers(questions, request.topic)
    except GeminiNotConfigured as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except GeminiResponseError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini returned an unreadable response after retrying. Please try again. ({exc})",
        )
    except genai_errors.ClientError as exc:
        if exc.code == 429:
            raise HTTPException(
                status_code=429,
                detail=(
                    "Gemini's free-tier rate limit was hit repeatedly and retries were "
                    "exhausted. Wait a minute and try again, or submit fewer questions at once."
                ),
            )
        raise HTTPException(status_code=400, detail=f"Gemini API rejected the request: {exc}")
    except genai_errors.ServerError as exc:
        raise HTTPException(status_code=502, detail=f"Gemini API server error: {exc}")
    except genai_errors.APIError as exc:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {exc}")

    return AnswerResponse(results=results)


@app.post("/download", dependencies=[Depends(verify_app_password)])
async def download(request: DownloadRequest) -> StreamingResponse:
    if not request.results:
        raise HTTPException(status_code=400, detail="No results provided.")

    buffer = build_mcq_docx(request.results)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=MCQ_Answer_Report.docx"},
    )
