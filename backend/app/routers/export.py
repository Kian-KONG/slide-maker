from fastapi import APIRouter, Response

from app.db import connection
from app.repo import project_detail
from app.services.html_export import build_html_bytes, content_disposition, sanitize_filename

router = APIRouter(prefix="/projects", tags=["export"])


@router.post("/{project_id}/export")
def export_project(project_id: str) -> Response:
    with connection() as conn:
        detail = project_detail(conn, project_id)
        data = build_html_bytes(detail.project.title, detail.slides)
        filename = sanitize_filename(detail.project.title)
        return Response(
            content=data,
            media_type="text/html; charset=utf-8",
            headers={"Content-Disposition": content_disposition(filename)},
        )
