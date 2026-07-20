import { randomUUID } from "node:crypto";
import {
  getDb,
  nowIso,
  outlineToJson,
  parseOutline,
  type OutlineItem,
  type ProjectRow,
  type SlideRow,
} from "./db.js";

export type Layout = "title" | "section" | "bullets" | "two_column";

export type SlideIn = {
  id?: string | null;
  position: number;
  layout: Layout;
  title: string;
  body: Record<string, unknown>;
};

export type SlideOut = {
  id: string;
  project_id: string;
  position: number;
  layout: Layout;
  title: string;
  body: Record<string, unknown>;
};

export type ProjectOut = {
  id: string;
  title: string;
  raw_notes: string;
  expanded_notes: string;
  outline: OutlineItem[];
  created_at: string;
  updated_at: string;
};

export type ProjectDetail = {
  project: ProjectOut;
  slides: SlideOut[];
};

const ALLOWED = new Set(["title", "section", "bullets", "two_column"]);

export function rowToProject(row: ProjectRow): ProjectOut {
  return {
    id: row.id,
    title: row.title,
    raw_notes: row.raw_notes,
    expanded_notes: row.expanded_notes || "",
    outline: parseOutline(row.outline_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function rowToSlide(row: SlideRow): SlideOut {
  let body: Record<string, unknown> = {};
  try {
    body = row.body ? JSON.parse(row.body) : {};
  } catch {
    body = {};
  }
  return {
    id: row.id,
    project_id: row.project_id,
    position: row.position,
    layout: (ALLOWED.has(row.layout) ? row.layout : "bullets") as Layout,
    title: row.title,
    body,
  };
}

export function getProjectRow(id: string): ProjectRow | undefined {
  return getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | ProjectRow
    | undefined;
}

export function fetchSlides(projectId: string): SlideOut[] {
  const rows = getDb()
    .prepare("SELECT * FROM slides WHERE project_id = ? ORDER BY position ASC")
    .all(projectId) as SlideRow[];
  return rows.map(rowToSlide);
}

export function projectDetail(projectId: string): ProjectDetail {
  const row = getProjectRow(projectId);
  if (!row) {
    const err = new Error("Project not found");
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }
  return { project: rowToProject(row), slides: fetchSlides(projectId) };
}

export function insertSlides(projectId: string, slides: SlideIn[]): void {
  const db = getDb();
  const del = db.prepare("DELETE FROM slides WHERE project_id = ?");
  const ins = db.prepare(
    "INSERT INTO slides (id, project_id, position, layout, title, body) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const tx = db.transaction(() => {
    del.run(projectId);
    slides.forEach((slide, position) => {
      ins.run(
        slide.id || randomUUID(),
        projectId,
        position,
        slide.layout,
        slide.title,
        JSON.stringify(slide.body ?? {}),
      );
    });
  });
  tx();
}

export function createProject(input: {
  title: string;
  raw_notes: string;
  expanded_notes?: string;
  outline?: OutlineItem[];
}): ProjectDetail {
  const id = randomUUID();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO projects
       (id, title, raw_notes, expanded_notes, outline_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.title,
      input.raw_notes,
      input.expanded_notes || "",
      outlineToJson(input.outline || []),
      now,
      now,
    );
  return projectDetail(id);
}

export { outlineToJson, nowIso };
