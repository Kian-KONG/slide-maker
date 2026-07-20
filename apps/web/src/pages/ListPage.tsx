import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { ProjectListItem } from "../types";

export default function ListPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listProjects();
      setProjects(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”?`)) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function projectHref(p: ProjectListItem) {
    if (p.has_slides) return `/projects/${p.id}`;
    if (p.has_expanded) return `/projects/${p.id}/expand`;
    return `/projects/${p.id}/expand`;
  }

  function statusLabel(p: ProjectListItem) {
    if (p.has_slides) return "Slides ready";
    if (p.has_expanded) return "Expanded · needs slides";
    return "Draft";
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Projects</h1>
        <Link className="btn primary" to="/new">
          New project
        </Link>
      </header>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="muted">No projects yet. Create one to get started.</p>
      )}

      {projects.length > 0 && (
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p.id} className="project-row">
              <Link className="project-link" to={projectHref(p)}>
                <span className="project-title">{p.title}</span>
                <span className="muted">
                  {statusLabel(p)} · Updated {new Date(p.updated_at).toLocaleString()}
                </span>
              </Link>
              <button
                type="button"
                className="btn danger"
                onClick={() => void handleDelete(p.id, p.title)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
