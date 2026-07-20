import type { Layout, ProjectDetail, ProjectListItem, SlideIn, SlideOut } from "../types";

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

function parseFilename(disposition: string | null): string {
  if (!disposition) return "presentation.html";
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      /* fall through */
    }
  }
  const plain = /filename="([^"]+)"/i.exec(disposition);
  return plain?.[1] || "presentation.html";
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
  structure: (body: { title?: string; raw_notes: string }) =>
    request<ProjectDetail>("/api/structure", {
      method: "POST",
      body: JSON.stringify(body),
    }),
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
  exportProject: async (id: string) => {
    const res = await fetch(`/api/projects/${id}/export`, { method: "POST" });
    if (!res.ok) {
      throw new Error(await errorDetail(res));
    }
    const blob = await res.blob();
    const filename = parseFilename(res.headers.get("Content-Disposition"));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
