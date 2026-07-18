import os
import time
from collections import defaultdict
from typing import Optional

from fastapi import Header, HTTPException, Request

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 10

_request_log: dict = defaultdict(list)


def verify_app_password(x_app_password: Optional[str] = Header(default=None)) -> None:
    """Gate protected routes behind a shared password. If APP_PASSWORD isn't
    set (e.g. local development), the gate is a no-op and the app stays open.
    """
    expected = os.environ.get("APP_PASSWORD", "").strip()
    if not expected:
        return
    if not x_app_password or x_app_password != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing app password.")


def rate_limit(request: Request) -> None:
    """Simple in-memory per-IP rate limit as defense-in-depth against a
    leaked/shared password burning through the Gemini API quota or billing.
    """
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    recent = [t for t in _request_log[ip] if t > window_start]
    if len(recent) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Too many requests from this IP. Please wait a minute and try again.",
        )

    recent.append(now)
    _request_log[ip] = recent
