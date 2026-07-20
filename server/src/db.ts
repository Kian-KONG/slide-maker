import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config.js";

export type OutlineItem = { title: string; intent: string };

export type ProjectRow = {
  id: string;
  title: string;
  raw_notes: string;
  expanded_notes: string;
  outline_json: string;
  created_at: string;
  updated_at: string;
};

export type SlideRow = {
  id: string;
  project_id: string;
  position: number;
  layout: string;
  title: string;
  body: string;
};

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
    db = new Database(config.databasePath);
    db.pragma("foreign_keys = ON");
    initDb(db);
  }
  return db;
}

function initDb(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      raw_notes TEXT NOT NULL DEFAULT '',
      expanded_notes TEXT NOT NULL DEFAULT '',
      outline_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS slides (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      layout TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '{}',
      UNIQUE(project_id, position)
    );
    CREATE INDEX IF NOT EXISTS idx_slides_project_pos ON slides(project_id, position);
  `);

  const cols = new Set(
    (database.prepare("PRAGMA table_info(projects)").all() as { name: string }[]).map(
      (c) => c.name,
    ),
  );
  if (!cols.has("expanded_notes")) {
    database.exec(
      "ALTER TABLE projects ADD COLUMN expanded_notes TEXT NOT NULL DEFAULT ''",
    );
  }
  if (!cols.has("outline_json")) {
    database.exec(
      "ALTER TABLE projects ADD COLUMN outline_json TEXT NOT NULL DEFAULT '[]'",
    );
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseOutline(raw: string | null | undefined): OutlineItem[] {
  try {
    const data = JSON.parse(raw || "[]");
    if (!Array.isArray(data)) return [];
    return data
      .filter((x) => x && typeof x === "object")
      .map((x) => ({
        title: String((x as OutlineItem).title || ""),
        intent: String((x as OutlineItem).intent || ""),
      }))
      .filter((x) => x.title.trim());
  } catch {
    return [];
  }
}

export function outlineToJson(outline: OutlineItem[]): string {
  return JSON.stringify(outline);
}
