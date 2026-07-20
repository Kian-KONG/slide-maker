"""Shared project/slide persistence helpers."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from app.schemas import ProjectDetail, ProjectOut, SlideIn, SlideOut


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_to_project(row) -> ProjectOut:
    return ProjectOut(
        id=row["id"],
        title=row["title"],
        raw_notes=row["raw_notes"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def row_to_slide(row) -> SlideOut:
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


def get_project_row(conn, project_id: str):
    return conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()


def fetch_slides(conn, project_id: str) -> list[SlideOut]:
    rows = conn.execute(
        "SELECT * FROM slides WHERE project_id = ? ORDER BY position ASC",
        (project_id,),
    ).fetchall()
    return [row_to_slide(r) for r in rows]


def project_detail(conn, project_id: str) -> ProjectDetail:
    row = get_project_row(conn, project_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectDetail(project=row_to_project(row), slides=fetch_slides(conn, project_id))


def insert_slides(conn, project_id: str, slides: list[SlideIn]) -> None:
    """Replace all slides for a project; positions renumbered 0..n-1 in list order."""
    conn.execute("DELETE FROM slides WHERE project_id = ?", (project_id,))
    for position, slide in enumerate(slides):
        conn.execute(
            "INSERT INTO slides (id, project_id, position, layout, title, body) VALUES (?, ?, ?, ?, ?, ?)",
            (
                slide.id or str(uuid.uuid4()),
                project_id,
                position,
                slide.layout,
                slide.title,
                json.dumps(slide.body),
            ),
        )
