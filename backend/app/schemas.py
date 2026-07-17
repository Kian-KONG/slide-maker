from typing import Any, Literal

from pydantic import BaseModel, Field

Layout = Literal["title", "section", "bullets", "two_column"]


class SlideIn(BaseModel):
    id: str | None = None
    position: int
    layout: Layout
    title: str = ""
    body: dict[str, Any] = Field(default_factory=dict)


class SlideOut(BaseModel):
    id: str
    project_id: str
    position: int
    layout: Layout
    title: str
    body: dict[str, Any]


class ProjectOut(BaseModel):
    id: str
    title: str
    raw_notes: str
    created_at: str
    updated_at: str


class ProjectListItem(BaseModel):
    id: str
    title: str
    updated_at: str


class ProjectCreate(BaseModel):
    title: str = "Untitled"
    raw_notes: str = ""


class ProjectPatch(BaseModel):
    title: str | None = None


class ProjectDetail(BaseModel):
    project: ProjectOut
    slides: list[SlideOut]


class SlidesReplace(BaseModel):
    slides: list[SlideIn]


class StructureRequest(BaseModel):
    title: str | None = None
    raw_notes: str


class StructureLLMResult(BaseModel):
    title: str
    slides: list[SlideIn]
