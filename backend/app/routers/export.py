from fastapi import APIRouter, Response

from app.db import get_connection
from app.routers.projects import _project_detail
from app.services.pptx_export import build_pptx, sanitize_filename

router = APIRouter(prefix="/projects", tags=["export"])

PPTX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
)


@router.post("/{project_id}/export")
def export_project(project_id: str) -> Response:
    conn = get_connection()
    try:
        detail = _project_detail(conn, project_id)
        data = build_pptx(detail.project.title, detail.slides)
        filename = sanitize_filename(detail.project.title)
        return Response(
            content=data,
            media_type=PPTX_MEDIA_TYPE,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    finally:
        conn.close()
