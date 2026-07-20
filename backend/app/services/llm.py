import json
import re

import httpx
from fastapi import HTTPException

from app.config import get_settings
from app.schemas import SlideIn, StructureLLMResult

ALLOWED_LAYOUTS = frozenset({"title", "section", "bullets", "two_column"})

SYSTEM_PROMPT = """You structure messy meeting notes into presentation slides.
Return ONLY valid JSON (no markdown fences) with this shape:
{"title": "...", "slides": [{"layout": "...", "title": "...", "body": {}}]}

Rules:
- Allowed layouts only: title, section, bullets, two_column
- body for title/section: {"subtitle": "..."}
- body for bullets: {"bullets": ["...", "..."]}
- body for two_column: {"left": [...], "right": [...], "left_title": "", "right_title": ""}
- Prefer cover (title) → section dividers → bullet pages; optional closing summary
- One focus per slide; short bullet phrases
- Keep key terms, names, product names from the notes
- Do not invent facts not present in the notes
"""


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, count=1, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text, count=1)
    return text.strip()


def _normalize_body(layout: str, body: object) -> dict:
    if not isinstance(body, dict):
        body = {}
    if layout == "title" or layout == "section":
        return {"subtitle": str(body.get("subtitle", "") or "")}
    if layout == "two_column":
        left = body.get("left", [])
        right = body.get("right", [])
        if not isinstance(left, list):
            left = []
        if not isinstance(right, list):
            right = []
        return {
            "left": [str(x) for x in left],
            "right": [str(x) for x in right],
            "left_title": str(body.get("left_title", "") or ""),
            "right_title": str(body.get("right_title", "") or ""),
        }
    # bullets (default)
    bullets = body.get("bullets", [])
    if not isinstance(bullets, list):
        bullets = []
    return {"bullets": [str(b) for b in bullets]}


def _normalize_slides(raw_slides: object) -> list[SlideIn]:
    if not isinstance(raw_slides, list):
        raw_slides = []
    slides: list[SlideIn] = []
    for i, item in enumerate(raw_slides):
        if not isinstance(item, dict):
            continue
        layout = item.get("layout", "bullets")
        if layout not in ALLOWED_LAYOUTS:
            layout = "bullets"
        body = _normalize_body(layout, item.get("body"))
        slides.append(
            SlideIn(
                position=i,
                layout=layout,
                title=str(item.get("title", "") or ""),
                body=body,
            )
        )
    return slides


def structure_notes(raw_notes: str, title: str | None = None) -> StructureLLMResult:
    settings = get_settings()
    if not settings.llm_api_key:
        raise HTTPException(status_code=503, detail="LLM_API_KEY is not configured")

    base = settings.llm_base_url.rstrip("/")
    url = f"{base}/chat/completions"
    user_parts = [f"Meeting notes:\n{raw_notes}"]
    if title:
        user_parts.insert(0, f"Preferred deck title: {title}")

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "\n\n".join(user_parts)},
        ],
        "temperature": 0.2,
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.llm_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"LLM request failed with status {exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="LLM request failed") from exc

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="LLM returned empty response") from exc

    if not isinstance(content, str) or not content.strip():
        raise HTTPException(status_code=502, detail="LLM returned empty response")

    try:
        parsed = json.loads(_strip_fences(content))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON") from exc

    if not isinstance(parsed, dict):
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON")

    deck_title = (title or "").strip() or str(parsed.get("title") or "Untitled").strip() or "Untitled"
    slides = _normalize_slides(parsed.get("slides"))
    return StructureLLMResult(title=deck_title, slides=slides)
