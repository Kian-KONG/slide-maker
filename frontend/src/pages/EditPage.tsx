import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, emptyBody, LAYOUTS, toSlideIn } from "../api/client";
import {
  buildRevealDocument,
  downloadHtml,
  sanitizeFilename,
} from "../lib/revealExport";
import type { Layout, ProjectDetail, SlideOut } from "../types";

function newSlide(position: number): SlideOut {
  return {
    id: crypto.randomUUID(),
    project_id: "",
    position,
    layout: "bullets",
    title: "New slide",
    body: emptyBody("bullets"),
  };
}

export default function EditPage() {
  const { id = "" } = useParams();
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [title, setTitle] = useState("");
  const [slides, setSlides] = useState<SlideOut[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.getProject(id);
      setDetail(d);
      setTitle(d.project.title);
      setSlides(d.slides);
      setSelected(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = slides[selected] ?? null;

  function updateCurrent(patch: Partial<SlideOut>) {
    setSlides((prev) =>
      prev.map((s, i) => (i === selected ? { ...s, ...patch } : s)),
    );
  }

  function setLayout(layout: Layout) {
    if (!current || current.layout === layout) return;
    updateCurrent({ layout, body: emptyBody(layout) });
  }

  function move(delta: number) {
    const next = selected + delta;
    if (next < 0 || next >= slides.length) return;
    setSlides((prev) => {
      const copy = [...prev];
      const tmp = copy[selected];
      copy[selected] = copy[next];
      copy[next] = tmp;
      return copy.map((s, i) => ({ ...s, position: i }));
    });
    setSelected(next);
  }

  function addSlide() {
    setSlides((prev) => {
      const s = newSlide(prev.length);
      s.project_id = id;
      return [...prev, s];
    });
    setSelected(slides.length);
  }

  function removeSlide() {
    if (slides.length === 0) return;
    const nextSelected = Math.max(0, Math.min(selected, slides.length - 2));
    setSlides((prev) =>
      prev.filter((_, i) => i !== selected).map((s, i) => ({ ...s, position: i })),
    );
    setSelected(nextSelected);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (detail && title.trim() && title.trim() !== detail.project.title) {
        await api.patchProject(id, title.trim());
      }
      const d = await api.putSlides(id, toSlideIn(slides));
      setDetail(d);
      setTitle(d.project.title);
      setSlides(d.slides);
      setSelected((i) => Math.min(i, Math.max(0, d.slides.length - 1)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setError(null);
    try {
      const html = buildRevealDocument(title.trim() || detail?.project.title || "Untitled", slides);
      downloadHtml(sanitizeFilename(title.trim() || "presentation"), html);
      await api.exportHtml(id, html);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (loading) {
    return (
      <div className="page page-wide">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!detail && error) {
    return (
      <div className="page page-wide">
        <p className="error">{error}</p>
        <Link className="btn" to="/">
          Back
        </Link>
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
          />
        </div>
        <div className="header-actions">
          <Link className="btn" to={`/projects/${id}/expand`}>
            Expand
          </Link>
          <Link className="btn" to={`/projects/${id}/preview`}>
            Preview
          </Link>
          <button type="button" className="btn" onClick={() => void handleExport()}>
            Export HTML
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="editor">
        <aside className="slide-rail">
          <div className="rail-toolbar">
            <button type="button" className="btn" onClick={addSlide}>
              Add
            </button>
            <button type="button" className="btn" onClick={() => move(-1)} disabled={selected <= 0}>
              ↑
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => move(1)}
              disabled={selected >= slides.length - 1}
            >
              ↓
            </button>
            <button type="button" className="btn danger" onClick={removeSlide}>
              Delete
            </button>
          </div>
          <ul className="slide-list">
            {slides.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`slide-item${i === selected ? " active" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <span className="muted">{i + 1}</span>
                  <span className="slide-item-title">{s.title || "(untitled)"}</span>
                  <span className="muted">{s.layout}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="slide-editor">
          {current ? (
            <SlideForm
              slide={current}
              onTitle={(t) => updateCurrent({ title: t })}
              onLayout={setLayout}
              onBody={(body) => updateCurrent({ body })}
            />
          ) : (
            <p className="muted">No slides. Add one to start.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function SlideForm({
  slide,
  onTitle,
  onLayout,
  onBody,
}: {
  slide: SlideOut;
  onTitle: (t: string) => void;
  onLayout: (l: Layout) => void;
  onBody: (b: Record<string, unknown>) => void;
}) {
  const body = slide.body || {};

  return (
    <div className="form">
      <label className="field">
        <span>Slide title</span>
        <input value={slide.title} onChange={(e) => onTitle(e.target.value)} />
      </label>

      <label className="field">
        <span>Layout</span>
        <select
          value={slide.layout}
          onChange={(e) => onLayout(e.target.value as Layout)}
        >
          {LAYOUTS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      {(slide.layout === "title" || slide.layout === "section") && (
        <label className="field">
          <span>Subtitle</span>
          <input
            value={String(body.subtitle ?? "")}
            onChange={(e) => onBody({ ...body, subtitle: e.target.value })}
          />
        </label>
      )}

      {slide.layout === "bullets" && (
        <label className="field">
          <span>Bullets (one per line)</span>
          <textarea
            rows={10}
            value={(Array.isArray(body.bullets) ? body.bullets : []).join("\n")}
            onChange={(e) =>
              onBody({
                ...body,
                bullets: e.target.value.split("\n"),
              })
            }
          />
        </label>
      )}

      {slide.layout === "two_column" && (
        <>
          <div className="two-fields">
            <label className="field">
              <span>Left title</span>
              <input
                value={String(body.left_title ?? "")}
                onChange={(e) => onBody({ ...body, left_title: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Right title</span>
              <input
                value={String(body.right_title ?? "")}
                onChange={(e) => onBody({ ...body, right_title: e.target.value })}
              />
            </label>
          </div>
          <div className="two-fields">
            <label className="field">
              <span>Left (one per line)</span>
              <textarea
                rows={8}
                value={(Array.isArray(body.left) ? body.left : []).join("\n")}
                onChange={(e) =>
                  onBody({ ...body, left: e.target.value.split("\n") })
                }
              />
            </label>
            <label className="field">
              <span>Right (one per line)</span>
              <textarea
                rows={8}
                value={(Array.isArray(body.right) ? body.right : []).join("\n")}
                onChange={(e) =>
                  onBody({ ...body, right: e.target.value.split("\n") })
                }
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
