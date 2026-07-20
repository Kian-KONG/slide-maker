import uuid

from fastapi import APIRouter, HTTPException, Response

from app.db import connection
from app.repo import get_project_row, insert_slides, now_iso, project_detail
from app.schemas import (
    ProjectCreate,
    ProjectDetail,
    ProjectListItem,
    ProjectPatch,
    SlidesReplace,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectListItem])
def list_projects() -> list[ProjectListItem]:
    with connection() as conn:
        rows = conn.execute(
            "SELECT id, title, updated_at FROM projects ORDER BY updated_at DESC"
        ).fetchall()
        return [
            ProjectListItem(id=r["id"], title=r["title"], updated_at=r["updated_at"])
            for r in rows
        ]


@router.post("", response_model=ProjectDetail, status_code=201)
def create_project(payload: ProjectCreate) -> ProjectDetail:
    project_id = str(uuid.uuid4())
    now = now_iso()
    with connection() as conn:
        conn.execute(
            "INSERT INTO projects (id, title, raw_notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (project_id, payload.title, payload.raw_notes, now, now),
        )
        conn.commit()
        return project_detail(conn, project_id)


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: str) -> ProjectDetail:
    with connection() as conn:
        return project_detail(conn, project_id)


@router.patch("/{project_id}", response_model=ProjectDetail)
def patch_project(project_id: str, payload: ProjectPatch) -> ProjectDetail:
    with connection() as conn:
        row = get_project_row(conn, project_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        if payload.title is not None:
            conn.execute(
                "UPDATE projects SET title = ?, updated_at = ? WHERE id = ?",
                (payload.title, now_iso(), project_id),
            )
            conn.commit()
        return project_detail(conn, project_id)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str) -> Response:
    with connection() as conn:
        row = get_project_row(conn, project_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        # FK CASCADE removes slides
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
        return Response(status_code=204)


@router.put("/{project_id}/slides", response_model=ProjectDetail)
def replace_slides(project_id: str, payload: SlidesReplace) -> ProjectDetail:
    with connection() as conn:
        row = get_project_row(conn, project_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        insert_slides(conn, project_id, payload.slides)
        conn.execute(
            "UPDATE projects SET updated_at = ? WHERE id = ?",
            (now_iso(), project_id),
        )
        conn.commit()
        return project_detail(conn, project_id)
