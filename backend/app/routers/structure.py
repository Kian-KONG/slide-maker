import uuid

from fastapi import APIRouter

from app.db import connection
from app.repo import insert_slides, now_iso, project_detail
from app.schemas import ProjectDetail, StructureRequest
from app.services.llm import structure_notes

router = APIRouter(tags=["structure"])


@router.post("/structure", response_model=ProjectDetail, status_code=201)
def structure_endpoint(payload: StructureRequest) -> ProjectDetail:
    result = structure_notes(payload.raw_notes, payload.title)

    project_id = str(uuid.uuid4())
    now = now_iso()
    with connection() as conn:
        conn.execute(
            "INSERT INTO projects (id, title, raw_notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (project_id, result.title, payload.raw_notes, now, now),
        )
        insert_slides(conn, project_id, result.slides)
        conn.commit()
        return project_detail(conn, project_id)
