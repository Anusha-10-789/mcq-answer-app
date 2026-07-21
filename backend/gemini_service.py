import asyncio
import json
import os
import re
from typing import List, Optional

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from models import MCQResult
from prompt import SYSTEM_PROMPT, format_explanation, resolve_topic

MODEL_ID = "gemini-3.1-flash-lite"
MAX_RETRIES = 3
DEFAULT_RETRY_SECONDS = 5.0
MAX_CONCURRENT_REQUESTS = 5
MAX_PARSE_RETRIES = 2


class GeminiNotConfigured(Exception):
    pass


class GeminiResponseError(Exception):
    pass


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise GeminiNotConfigured(
            "GEMINI_API_KEY is not set. Add it to backend/.env and restart the backend."
        )
    return genai.Client(api_key=api_key)


def _retry_delay_seconds(exc: genai_errors.ClientError) -> float:
    try:
        for detail in exc.details.get("error", {}).get("details", []):
            if detail.get("@type", "").endswith("RetryInfo"):
                match = re.match(r"([\d.]+)", detail.get("retryDelay", ""))
                if match:
                    return float(match.group(1))
    except Exception:
        pass
    return DEFAULT_RETRY_SECONDS


async def _generate_with_retry(client: genai.Client, question_text: str):
    attempt = 0
    while True:
        try:
            return await client.aio.models.generate_content(
                model=MODEL_ID,
                contents=question_text,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    temperature=0.2,
                    max_output_tokens=1024,
                ),
            )
        except genai_errors.ClientError as exc:
            if exc.code != 429 or attempt >= MAX_RETRIES:
                raise
            await asyncio.sleep(_retry_delay_seconds(exc) + 1)
            attempt += 1


async def _answer_one(
    semaphore: asyncio.Semaphore,
    client: genai.Client,
    question_text: str,
    topic_override: Optional[str],
) -> MCQResult:
    last_error = None
    for attempt in range(MAX_PARSE_RETRIES + 1):
        async with semaphore:
            response = await _generate_with_retry(client, question_text)

        try:
            data = json.loads(response.text)
        except (json.JSONDecodeError, TypeError) as exc:
            finish_reason = None
            try:
                finish_reason = response.candidates[0].finish_reason
            except Exception:
                pass
            last_error = GeminiResponseError(
                f"Gemini returned a response that could not be parsed as JSON "
                f"(finish_reason={finish_reason}): {exc}. Raw text: {response.text!r}"
            )
            continue

        return MCQResult(
            question=question_text.strip(),
            topic=resolve_topic(data, topic_override),
            correct_answer=str(data.get("correct_answer", "")).strip(),
            explanation=format_explanation(str(data.get("explanation", "")).strip()),
        )

    raise last_error


async def get_mcq_answers(questions: List[str], topic_override: Optional[str] = None) -> List[MCQResult]:
    client = _get_client()
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    tasks = [_answer_one(semaphore, client, question, topic_override) for question in questions]
    return await asyncio.gather(*tasks)
