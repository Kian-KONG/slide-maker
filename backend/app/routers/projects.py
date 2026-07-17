import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Response

from app.db import get_connection
from app.schemas import (
    ProjectCreate,
    ProjectDetail,
    ProjectListItem,
    ProjectOut,
    ProjectPatch,
    SlideOut,
    SlidesReplace,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _row_to_project(row) -> ProjectOut:
    return ProjectOut(
        id=row["id"],
        title=row["title"],
        raw_notes=row["raw_notes"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_to_slide(row) -> SlideOut:
    body = row["body"]
    if isinstance(body, str):
        body = json.loads(body) if body else {}
    return SlideOut(
        id=row["id"],
        project_id=row["project_id"],
        position=row["position"],
        layout=row["layout"],
        title=row["title"],
        body=body,
    )


def _get_project_row(conn, project_id: str):
    return conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()


def _fetch_slides(conn, project_id: str) -> list[SlideOut]:
    rows = conn.execute(
        "SELECT * FROM slides WHERE project_id = ? ORDER BY position ASC",
        (project_id,),
    ).fetchall()
    return [_row_to_slide(r) for r in rows]


def _project_detail(conn, project_id: str) -> ProjectDetail:
    row = _get_project_row(conn, project_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectDetail(project=_row_to_project(row), slides=_fetch_slides(conn, project_id))


@router.get("", response_model=list[ProjectListItem])
def list_projects() -> list[ProjectListItem]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, title, updated_at FROM projects ORDER BY updated_at DESC"
        ).fetchall()
        return [
            ProjectListItem(id=r["id"], title=r["title"], updated_at=r["updated_at"])
            for r in rows
        ]
    finally:
        conn.close()


@router.post("", response_model=ProjectDetail, status_code=201)
def create_project(payload: ProjectCreate) -> ProjectDetail:
    project_id = str(uuid.uuid4())
    now = _now()
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO projects (id, title, raw_notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (project_id, payload.title, payload.raw_notes, now, now),
        )
        conn.commit()
        return _project_detail(conn, project_id)
    finally:
        conn.close()


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: str) -> ProjectDetail:
    conn = get_connection()
    try:
        return _project_detail(conn, project_id)
    finally:
        conn.close()


@router.patch("/{project_id}", response_model=ProjectDetail)
def patch_project(project_id: str, payload: ProjectPatch) -> ProjectDetail:
    conn = get_connection()
    try:
        row = _get_project_row(conn, project_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        if payload.title is not None:
            conn.execute(
                "UPDATE projects SET title = ?, updated_at = ? WHERE id = ?",
                (payload.title, _now(), project_id),
            )
            conn.commit()
        return _project_detail(conn, project_id)
    finally:
        conn.close()


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str) -> Response:
    conn = get_connection()
    try:
        row = _get_project_row(conn, project_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        conn.execute("DELETE FROM slides WHERE project_id = ?", (project_id,))
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
        return Response(status_code=204)
    finally:
        conn.close()


@router.put("/{project_id}/slides", response_model=ProjectDetail)
def replace_slides(project_id: str, payload: SlidesReplace) -> ProjectDetail:
    conn = get_connection()
    try:
        row = _get_project_row(conn, project_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")

        conn.execute("DELETE FROM slides WHERE project_id = ?", (project_id,))
        for slide in payload.slides:
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
        conn.execute(
            "UPDATE projects SET updated_at = ? WHERE id = ?",
            (_now(), project_id),
        )
        conn.commit()
        return _project_detail(conn, project_id)
    finally:
        conn.close()
