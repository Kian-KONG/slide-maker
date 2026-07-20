import type {
  ExpandResult,
  Layout,
  OutlineItem,
  ProjectDetail,
  ProjectListItem,
  SlideIn,
  SlideOut,
} from "../types";

async function errorDetail(res: Response): Promise<string> {
  let detail = res.statusText;
  try {
    const j = await res.json();
    detail = j.detail ?? detail;
  } catch {
    /* ignore */
  }
  return typeof detail === "string" ? detail : JSON.stringify(detail);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    throw new Error(await errorDetail(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const LAYOUTS: Layout[] = ["title", "section", "bullets", "two_column"];

export function emptyBody(layout: Layout): Record<string, unknown> {
  if (layout === "title" || layout === "section") return { subtitle: "" };
  if (layout === "two_column") {
    return { left: [], right: [], left_title: "", right_title: "" };
  }
  return { bullets: [""] };
}

export function toSlideIn(slides: SlideOut[]): SlideIn[] {
  return slides.map((s, i) => ({
    id: s.id,
    position: i,
    layout: s.layout,
    title: s.title,
    body: s.body,
  }));
}

export const api = {
  listProjects: () => request<ProjectListItem[]>("/api/projects"),
  getProject: (id: string) => request<ProjectDetail>(`/api/projects/${id}`),
  deleteProject: (id: string) =>
    request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  expand: (body: { title?: string; raw_notes: string }) =>
    request<ExpandResult>("/api/expand", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  reExpand: (id: string) =>
    request<ExpandResult>(`/api/projects/${id}/re-expand`, { method: "POST" }),
  saveExpanded: (
    id: string,
    body: { expanded_notes?: string; outline?: OutlineItem[]; title?: string },
  ) =>
    request<ExpandResult>(`/api/projects/${id}/expanded`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  generate: (id: string) =>
    request<ProjectDetail>(`/api/projects/${id}/generate`, { method: "POST" }),
  putSlides: (id: string, slides: SlideIn[]) =>
    request<ProjectDetail>(`/api/projects/${id}/slides`, {
      method: "PUT",
      body: JSON.stringify({ slides }),
    }),
  patchProject: (id: string, title: string) =>
    request<ProjectDetail>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),
  exportHtml: (id: string, html: string) =>
    request<{ ok: boolean; path: string; slug: string }>(
      `/api/projects/${id}/export-html`,
      {
        method: "POST",
        body: JSON.stringify({ html }),
      },
    ),
};
