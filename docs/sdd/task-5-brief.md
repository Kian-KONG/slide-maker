### Task 5: Frontend scaffold + List + New

**Files:**
- Create: `frontend/` via Vite React-TS template
- Create: `frontend/src/types.ts`, `frontend/src/api/client.ts`
- Create: `frontend/src/pages/ListPage.tsx`, `frontend/src/pages/NewPage.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/vite.config.ts`
- Manual test: browser / curl via UI

**Interfaces:**
- Consumes: `GET /api/projects`, `POST /api/structure`
- Produces: routes `/`, `/new`

- [ ] **Step 1: Scaffold Vite app**

```bash
cd /Users/bob/Workspace/slide-maker
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install && npm install react-router-dom
```

`vite.config.ts` proxy:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8000" },
  },
});
```

- [ ] **Step 2: Types + API client**

`frontend/src/types.ts` — mirror `ProjectOut`, `SlideOut`, `ProjectDetail`, `Layout`.

`frontend/src/api/client.ts`:

```ts
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
    } catch { /* ignore */ }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listProjects: () => request<{ id: string; title: string; updated_at: string }[]>("/api/projects"),
  getProject: (id: string) => request<import("../types").ProjectDetail>(`/api/projects/${id}`),
  deleteProject: (id: string) => request<void>(`/api/projects/${id}`, { method: "DELETE" }),
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
```

- [ ] **Step 3: Pages + router**

`App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ListPage from "./pages/ListPage";
import NewPage from "./pages/NewPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/new" element={<NewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

`ListPage`: load list, link to `/new`, each row → `/projects/:id` (placeholder ok until Task 6), delete button.

`NewPage`: textarea + optional title + submit → `api.structure` → `navigate(/projects/${id})`; show loading and error.

Keep CSS simple, readable, not purple-gradient AI slop — neutral light UI.

- [ ] **Step 4: Manual smoke**

```bash
# terminal 1
cd backend && source .venv/bin/activate && PYTHONPATH=. uvicorn app.main:app --reload --port 8000
# terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5173` — list loads; `/new` form renders.

- [ ] **Step 5: Commit**

```bash
git add frontend
git commit -m "$(cat <<'EOF'
feat: add React frontend with list and new project pages

EOF
)"
```

---

