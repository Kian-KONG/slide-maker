import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { OutlineItem } from "../types";

export default function ExpandPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [expanded, setExpanded] = useState("");
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [rawPreview, setRawPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.getProject(id);
      setTitle(d.project.title);
      setExpanded(d.project.expanded_notes || "");
      setOutline(d.project.outline || []);
      setRawPreview(d.project.raw_notes || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateOutline(i: number, patch: Partial<OutlineItem>) {
    setOutline((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  function moveOutline(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= outline.length) return;
    setOutline((prev) => {
      const copy = [...prev];
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
      return copy;
    });
  }

  function addOutline() {
    setOutline((prev) => [...prev, { title: "New chapter", intent: "" }]);
  }

  function removeOutline(i: number) {
    setOutline((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await api.saveExpanded(id, {
        title: title.trim() || undefined,
        expanded_notes: expanded,
        outline,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleReExpand() {
    if (!window.confirm("Re-expand from raw notes? Current expanded text will be replaced.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.reExpand(id);
      setTitle(result.project.title);
      setExpanded(result.expanded_notes);
      setOutline(result.outline);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate(skipSave = false) {
    setBusy(true);
    setError(null);
    try {
      if (!skipSave) {
        await api.saveExpanded(id, {
          title: title.trim() || undefined,
          expanded_notes: expanded,
          outline,
        });
      }
      await api.generate(id);
      navigate(`/projects/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="page page-wide">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div className="header-title-row">
          <Link className="btn" to="/">
            Back
          </Link>
          <input
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Project title"
            disabled={busy}
          />
        </div>
        <div className="header-actions">
          <button type="button" className="btn" disabled={busy} onClick={() => void handleReExpand()}>
            Re-expand
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => void handleSave()}>
            Save draft
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy || !expanded.trim()}
            onClick={() => void handleGenerate(false)}
          >
            {busy ? "Working…" : "Generate slides"}
          </button>
        </div>
      </header>

      <p className="muted step-hint">
        Step 2 · Edit the expanded narrative and chapter outline (aim for 4–6 chapters). Slides are generated from this text — target ≤12 dense pages, not the raw notes.
      </p>

      {error && <p className="error">{error}</p>}

      <div className="expand-grid">
        <section className="expand-panel">
          <div className="panel-head">
            <h2>Expanded narrative</h2>
            <span className="muted">editable</span>
          </div>
          <textarea
            className="expand-editor"
            value={expanded}
            onChange={(e) => setExpanded(e.target.value)}
            rows={22}
            disabled={busy}
          />
          <details className="raw-details">
            <summary className="muted">Raw source (read-only)</summary>
            <pre className="raw-pre">{rawPreview || "(empty)"}</pre>
          </details>
        </section>

        <aside className="expand-panel">
          <div className="panel-head">
            <h2>Outline</h2>
            <button type="button" className="btn" disabled={busy} onClick={addOutline}>
              Add
            </button>
          </div>
          <ul className="outline-list">
            {outline.map((o, i) => (
              <li key={i} className="outline-item">
                <div className="outline-row">
                  <span className="muted">{i + 1}</span>
                  <input
                    value={o.title}
                    onChange={(e) => updateOutline(i, { title: e.target.value })}
                    disabled={busy}
                    aria-label={`Chapter ${i + 1} title`}
                  />
                </div>
                <input
                  className="outline-intent"
                  value={o.intent}
                  onChange={(e) => updateOutline(i, { intent: e.target.value })}
                  placeholder="Intent / so what?"
                  disabled={busy}
                />
                <div className="outline-actions">
                  <button type="button" className="btn" disabled={busy || i === 0} onClick={() => moveOutline(i, -1)}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={busy || i >= outline.length - 1}
                    onClick={() => moveOutline(i, 1)}
                  >
                    ↓
                  </button>
                  <button type="button" className="btn danger" disabled={busy} onClick={() => removeOutline(i)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {outline.length === 0 && (
            <p className="muted">No chapters yet. Add some or re-expand from raw notes.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
