async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listProjects: () =>
    request<{ id: string; title: string; updated_at: string }[]>("/api/projects"),
  getProject: (id: string) =>
    request<import("../types").ProjectDetail>(`/api/projects/${id}`),
  deleteProject: (id: string) =>
    request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  structure: (body: { title?: string; raw_notes: string }) =>
    request<import("../types").ProjectDetail>("/api/structure", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  putSlides: (id: string, slides: import("../types").SlideIn[]) =>
    request<import("../types").ProjectDetail>(`/api/projects/${id}/slides`, {
      method: "PUT",
      body: JSON.stringify({ slides }),
    }),
  patchProject: (id: string, title: string) =>
    request<import("../types").ProjectDetail>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),
};
