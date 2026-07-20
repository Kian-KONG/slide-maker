import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";

const tmpDb = path.join(os.tmpdir(), `slide-maker-test-${process.pid}.db`);
const tmpDecks = fs.mkdtempSync(path.join(os.tmpdir(), "slide-decks-"));

process.env.DATABASE_PATH = tmpDb;
process.env.CONTENT_DECKS_PATH = tmpDecks;
process.env.LLM_API_KEY = "test-key";
process.env.LLM_BASE_URL = "https://example.com/v1";
process.env.LLM_MODEL = "test-model";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { getDb } = await import("../src/db.js");
const { registerRoutes } = await import("../src/routes/index.js");

describe("API", () => {
  const app = Fastify();
  let projectId = "";

  before(async () => {
    getDb();
    await app.register(cors, { origin: true });
    await registerRoutes(app);
    await app.ready();
  });

  after(async () => {
    await app.close();
    try {
      fs.unlinkSync(tmpDb);
    } catch {
      /* ignore */
    }
    fs.rmSync(tmpDecks, { recursive: true, force: true });
  });

  it("GET /api/health", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { status: "ok" });
  });

  it("create list put slides delete", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { title: "Demo", raw_notes: "notes" },
    });
    assert.equal(created.statusCode, 201);
    const body = created.json() as {
      project: { id: string; title: string };
      slides: unknown[];
    };
    assert.equal(body.project.title, "Demo");
    assert.deepEqual(body.slides, []);
    projectId = body.project.id;

    const list = await app.inject({ method: "GET", url: "/api/projects" });
    assert.equal(list.statusCode, 200);
    assert.ok(
      (list.json() as { id: string }[]).some((p) => p.id === projectId),
    );

    const put = await app.inject({
      method: "PUT",
      url: `/api/projects/${projectId}/slides`,
      payload: {
        slides: [
          {
            id: "s1",
            position: 0,
            layout: "title",
            title: "Hello",
            body: { subtitle: "World" },
          },
          {
            id: "s2",
            position: 1,
            layout: "bullets",
            title: "Points",
            body: { bullets: ["a", "b"] },
          },
        ],
      },
    });
    assert.equal(put.statusCode, 200);
    assert.equal((put.json() as { slides: unknown[] }).slides.length, 2);

    const got = await app.inject({
      method: "GET",
      url: `/api/projects/${projectId}`,
    });
    const detail = got.json() as {
      slides: { title: string; body: { bullets?: string[] } }[];
    };
    assert.equal(detail.slides[0].title, "Hello");
    assert.deepEqual(detail.slides[1].body.bullets, ["a", "b"]);
  });

  it("renumbers slide positions", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { title: "Dup" },
    });
    const pid = (created.json() as { project: { id: string } }).project.id;
    const r = await app.inject({
      method: "PUT",
      url: `/api/projects/${pid}/slides`,
      payload: {
        slides: [
          { id: "a", position: 5, layout: "title", title: "A", body: {} },
          {
            id: "b",
            position: 5,
            layout: "bullets",
            title: "B",
            body: { bullets: ["x"] },
          },
          { id: "c", position: 0, layout: "section", title: "C", body: {} },
        ],
      },
    });
    assert.equal(r.statusCode, 200);
    const slides = (r.json() as { slides: { position: number; title: string }[] })
      .slides;
    assert.deepEqual(
      slides.map((s) => s.position),
      [0, 1, 2],
    );
    assert.deepEqual(
      slides.map((s) => s.title),
      ["A", "B", "C"],
    );
  });

  it("export-html writes deck files", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { title: "Frontier", raw_notes: "raw here" },
    });
    const pid = (created.json() as { project: { id: string } }).project.id;
    await app.inject({
      method: "PATCH",
      url: `/api/projects/${pid}/expanded`,
      payload: {
        expanded_notes: "# Expanded\n\nBody",
        outline: [{ title: "One", intent: "open" }],
      },
    });
    await app.inject({
      method: "PUT",
      url: `/api/projects/${pid}/slides`,
      payload: {
        slides: [
          {
            layout: "title",
            title: "Frontier",
            body: { subtitle: "Hi" },
          },
        ],
      },
    });

    const html = "<!DOCTYPE html><html><body>reveal</body></html>";
    const res = await app.inject({
      method: "POST",
      url: `/api/projects/${pid}/export-html`,
      payload: { html },
    });
    assert.equal(res.statusCode, 200);
    const out = res.json() as { ok: boolean; path: string; slug: string };
    assert.equal(out.ok, true);
    assert.equal(out.slug, "Frontier");
    assert.ok(fs.existsSync(out.path));
    assert.equal(fs.readFileSync(out.path, "utf8"), html);
    const folder = path.dirname(out.path);
    assert.ok(fs.existsSync(path.join(folder, "notes.md")));
    assert.ok(fs.existsSync(path.join(folder, "expanded.md")));
    assert.ok(fs.existsSync(path.join(folder, "meta.json")));
  });

  it("delete project", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { title: "X" },
    });
    const pid = (created.json() as { project: { id: string } }).project.id;
    const del = await app.inject({ method: "DELETE", url: `/api/projects/${pid}` });
    assert.equal(del.statusCode, 204);
    const got = await app.inject({ method: "GET", url: `/api/projects/${pid}` });
    assert.equal(got.statusCode, 404);
  });
});
