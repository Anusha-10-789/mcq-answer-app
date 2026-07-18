from typing import List, Optional

from pydantic import BaseModel


class AnswerRequest(BaseModel):
    questions: List[str]
    topic: Optional[str] = None


class MCQResult(BaseModel):
    question: str
    topic: str
    correct_answer: str
    explanation: str


class AnswerResponse(BaseModel):
    results: List[MCQResult]


class DownloadRequest(BaseModel):
    results: List[MCQResult]
