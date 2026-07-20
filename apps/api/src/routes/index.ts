import type { FastifyInstance } from "fastify";
import { ZodError, z } from "zod";
import { getDb, nowIso, outlineToJson, type OutlineItem } from "../db.js";
import {
  createProject,
  getProjectRow,
  insertSlides,
  projectDetail,
  type Layout,
  type SlideIn,
} from "../repo.js";
import { deckSlug, saveDeckHtml, saveProjectTexts } from "../services/deckStore.js";
import { expandNotes, slidesFromExpanded } from "../services/llm.js";

const outlineItem = z.object({
  title: z.string(),
  intent: z.string().optional().default(""),
});

function sendError(
  reply: { code: (n: number) => { send: (b: unknown) => unknown } },
  err: unknown,
) {
  if (err instanceof ZodError) {
    const detail = err.issues.map((i) => i.message).join("; ") || "Invalid request";
    return reply.code(400).send({ detail });
  }
  const status = (err as { statusCode?: number }).statusCode || 500;
  const detail = err instanceof Error ? err.message : String(err);
  return reply.code(status).send({ detail });
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/health", async () => ({ status: "ok" }));

  app.get("/api/projects", async () => {
    const rows = getDb()
      .prepare(
        `SELECT p.id, p.title, p.updated_at, p.expanded_notes,
                (SELECT COUNT(*) FROM slides s WHERE s.project_id = p.id) AS slide_count
         FROM projects p ORDER BY p.updated_at DESC`,
      )
      .all() as {
      id: string;
      title: string;
      updated_at: string;
      expanded_notes: string;
      slide_count: number;
    }[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      updated_at: r.updated_at,
      has_expanded: Boolean((r.expanded_notes || "").trim()),
      has_slides: Number(r.slide_count || 0) > 0,
    }));
  });

  app.post("/api/projects", async (req, reply) => {
    const body = z
      .object({ title: z.string().optional(), raw_notes: z.string().optional() })
      .parse(req.body);
    return reply.code(201).send(
      createProject({
        title: body.title || "Untitled",
        raw_notes: body.raw_notes || "",
      }),
    );
  });

  app.get("/api/projects/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return projectDetail(id);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.patch("/api/projects/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = z.object({ title: z.string().optional() }).parse(req.body);
      const row = getProjectRow(id);
      if (!row) return reply.code(404).send({ detail: "Project not found" });
      if (body.title !== undefined) {
        getDb()
          .prepare("UPDATE projects SET title = ?, updated_at = ? WHERE id = ?")
          .run(body.title, nowIso(), id);
      }
      return projectDetail(id);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.delete("/api/projects/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = getProjectRow(id);
    if (!row) return reply.code(404).send({ detail: "Project not found" });
    getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
    return reply.code(204).send();
  });

  app.put("/api/projects/:id/slides", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      if (!getProjectRow(id)) return reply.code(404).send({ detail: "Project not found" });
      const body = z
        .object({
          slides: z.array(
            z.object({
              id: z.string().nullable().optional(),
              position: z.number().optional(),
              layout: z.enum(["title", "section", "bullets", "two_column"]),
              title: z.string().optional().default(""),
              body: z.record(z.unknown()).optional().default({}),
            }),
          ),
        })
        .parse(req.body);
      const slides: SlideIn[] = body.slides.map((s, i) => ({
        id: s.id,
        position: i,
        layout: s.layout as Layout,
        title: s.title || "",
        body: s.body || {},
      }));
      insertSlides(id, slides);
      getDb()
        .prepare("UPDATE projects SET updated_at = ? WHERE id = ?")
        .run(nowIso(), id);
      return projectDetail(id);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post("/api/expand", async (req, reply) => {
    try {
      const body = z
        .object({ title: z.string().nullable().optional(), raw_notes: z.string() })
        .parse(req.body);
      const result = await expandNotes(body.raw_notes, body.title);
      const detail = createProject({
        title: result.title,
        raw_notes: body.raw_notes,
        expanded_notes: result.expanded_notes,
        outline: result.outline,
      });
      saveProjectTexts(detail);
      return reply.code(201).send({
        project: detail.project,
        expanded_notes: detail.project.expanded_notes,
        outline: detail.project.outline,
        slides: detail.slides,
      });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post("/api/projects/:id/re-expand", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const row = getProjectRow(id);
      if (!row) return reply.code(404).send({ detail: "Project not found" });
      const result = await expandNotes(row.raw_notes, row.title);
      getDb()
        .prepare(
          `UPDATE projects SET expanded_notes = ?, outline_json = ?, title = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(
          result.expanded_notes,
          outlineToJson(result.outline),
          result.title,
          nowIso(),
          id,
        );
      const detail = projectDetail(id);
      saveProjectTexts(detail);
      return {
        project: detail.project,
        expanded_notes: detail.project.expanded_notes,
        outline: detail.project.outline,
        slides: detail.slides,
      };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.patch("/api/projects/:id/expanded", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const row = getProjectRow(id);
      if (!row) return reply.code(404).send({ detail: "Project not found" });
      const body = z
        .object({
          expanded_notes: z.string().optional(),
          outline: z.array(outlineItem).optional(),
          title: z.string().optional(),
        })
        .parse(req.body);
      const expanded =
        body.expanded_notes !== undefined ? body.expanded_notes : row.expanded_notes;
      const outlineJson =
        body.outline !== undefined
          ? outlineToJson(body.outline as OutlineItem[])
          : row.outline_json;
      const title = body.title !== undefined ? body.title : row.title;
      getDb()
        .prepare(
          `UPDATE projects SET expanded_notes = ?, outline_json = ?, title = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(expanded, outlineJson, title, nowIso(), id);
      const detail = projectDetail(id);
      saveProjectTexts(detail);
      return {
        project: detail.project,
        expanded_notes: detail.project.expanded_notes,
        outline: detail.project.outline,
        slides: detail.slides,
      };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post("/api/projects/:id/generate", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const detail0 = projectDetail(id);
      if (!detail0.project.expanded_notes.trim()) {
        return reply
          .code(400)
          .send({ detail: "Expand notes first before generating slides" });
      }
      const result = await slidesFromExpanded(detail0.project.expanded_notes, {
        title: detail0.project.title,
        outline: detail0.project.outline,
      });
      if (result.title && result.title !== detail0.project.title) {
        getDb()
          .prepare("UPDATE projects SET title = ?, updated_at = ? WHERE id = ?")
          .run(result.title, nowIso(), id);
      } else {
        getDb()
          .prepare("UPDATE projects SET updated_at = ? WHERE id = ?")
          .run(nowIso(), id);
      }
      insertSlides(id, result.slides);
      return projectDetail(id);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post("/api/structure", async (req, reply) => {
    try {
      const body = z
        .object({ title: z.string().nullable().optional(), raw_notes: z.string() })
        .parse(req.body);
      const expanded = await expandNotes(body.raw_notes, body.title);
      const slides = await slidesFromExpanded(expanded.expanded_notes, {
        title: expanded.title,
        outline: expanded.outline,
      });
      const detail = createProject({
        title: expanded.title,
        raw_notes: body.raw_notes,
        expanded_notes: expanded.expanded_notes,
        outline: expanded.outline,
      });
      insertSlides(detail.project.id, slides.slides);
      const full = projectDetail(detail.project.id);
      saveProjectTexts(full);
      return reply.code(201).send(full);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post("/api/projects/:id/export-html", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = z.object({ html: z.string().min(1) }).parse(req.body);
      const detail = projectDetail(id);
      const saved = saveDeckHtml(detail, body.html);
      return {
        ok: true,
        path: saved,
        slug: deckSlug(detail.project.title, detail.project.id),
      };
    } catch (err) {
      return sendError(reply, err);
    }
  });
}
