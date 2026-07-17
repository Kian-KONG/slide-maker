import json
import uuid

from fastapi import APIRouter

from app.db import get_connection
from app.routers.projects import _now, _project_detail
from app.schemas import ProjectDetail, StructureRequest
from app.services.llm import structure_notes

router = APIRouter(tags=["structure"])


@router.post("/structure", response_model=ProjectDetail, status_code=201)
def structure_endpoint(payload: StructureRequest) -> ProjectDetail:
    result = structure_notes(payload.raw_notes, payload.title)

    project_id = str(uuid.uuid4())
    now = _now()
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO projects (id, title, raw_notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (project_id, result.title, payload.raw_notes, now, now),
        )
        for slide in result.slides:
            slide_id = slide.id or str(uuid.uuid4())
            conn.execute(
                "INSERT INTO slides (id, project_id, position, layout, title, body) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    slide_id,
                    project_id,
                    slide.position,
                    slide.layout,
                    slide.title,
                    json.dumps(slide.body),
                ),
            )
        conn.commit()
        return _project_detail(conn, project_id)
    finally:
        conn.close()
