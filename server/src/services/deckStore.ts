import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import type { ProjectDetail } from "../repo.js";

export function slugify(title: string): string {
  let name = title.trim() || "untitled";
  name = name.replace(/[\\/:*?"<>|]+/g, "-");
  name = name.replace(/\s+/g, "-");
  name = name.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  return name.slice(0, 80) || "untitled";
}

export function decksRoot(): string {
  fs.mkdirSync(config.contentDecksPath, { recursive: true });
  return config.contentDecksPath;
}

export function deckFolder(title: string): string {
  const folder = path.join(decksRoot(), slugify(title));
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

export function saveProjectTexts(detail: ProjectDetail): string {
  const folder = deckFolder(detail.project.title);
  const notes = (detail.project.raw_notes || "").trim();
  if (notes) fs.writeFileSync(path.join(folder, "notes.md"), notes + "\n", "utf8");
  const expanded = (detail.project.expanded_notes || "").trim();
  if (expanded) {
    fs.writeFileSync(path.join(folder, "expanded.md"), expanded + "\n", "utf8");
  }
  const meta = {
    title: detail.project.title,
    project_id: detail.project.id,
    slug: slugify(detail.project.title),
    slide_count: detail.slides.length,
    has_expanded: Boolean(expanded),
    pipeline: "expand-v1-node",
    updated_at: new Date().toISOString(),
    source_updated_at: detail.project.updated_at,
    outline: detail.project.outline,
  };
  fs.writeFileSync(
    path.join(folder, "meta.json"),
    JSON.stringify(meta, null, 2) + "\n",
    "utf8",
  );
  return folder;
}

export function saveDeckHtml(detail: ProjectDetail, html: string): string {
  const folder = saveProjectTexts(detail);
  const slidesPath = path.join(folder, "slides.html");
  fs.writeFileSync(slidesPath, html, "utf8");
  const metaPath = path.join(folder, "meta.json");
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as Record<string, unknown>;
  meta.slide_count = detail.slides.length;
  meta.updated_at = new Date().toISOString();
  meta.renderer = "reveal.js";
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
  return slidesPath;
}
