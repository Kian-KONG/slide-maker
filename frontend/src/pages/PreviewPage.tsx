import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { ProjectDetail, SlideOut } from "../types";

export default function PreviewPage() {
  const { id = "" } = useParams();
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.getProject(id);
      setDetail(d);
      setIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!detail) return;
    const last = Math.max(0, detail.slides.length - 1);
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, last));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  async function handleExport() {
    setError(null);
    try {
      await api.exportProject(id);
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

  if (!detail) {
    return (
      <div className="page page-wide">
        <p className="error">{error || "Project not found"}</p>
        <Link className="btn" to="/">
          Back
        </Link>
      </div>
    );
  }

  const slides = detail.slides;
  const slide = slides[index];
  const total = slides.length;

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div className="header-title-row">
          <Link className="btn" to={`/projects/${id}`}>
            Edit
          </Link>
          <h1>{detail.project.title}</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn"
            disabled={index <= 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            Prev
          </button>
          <span className="muted">
            {total === 0 ? "0 / 0" : `${index + 1} / ${total}`}
          </span>
          <button
            type="button"
            className="btn"
            disabled={index >= total - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            Next
          </button>
          <button type="button" className="btn primary" onClick={() => void handleExport()}>
            Export HTML
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {slide ? (
        <SlideCanvas slide={slide} />
      ) : (
        <p className="muted">No slides to preview.</p>
      )}
    </div>
  );
}

function SlideCanvas({ slide }: { slide: SlideOut }) {
  const body = slide.body || {};

  if (slide.layout === "title") {
    return (
      <div className="canvas canvas-center">
        <h2 className="canvas-title">{slide.title}</h2>
        {body.subtitle ? <p className="canvas-sub">{String(body.subtitle)}</p> : null}
      </div>
    );
  }

  if (slide.layout === "section") {
    return (
      <div className="canvas canvas-center canvas-section">
        <h2 className="canvas-title">{slide.title}</h2>
        {body.subtitle ? <p className="canvas-sub">{String(body.subtitle)}</p> : null}
      </div>
    );
  }

  if (slide.layout === "two_column") {
    const left = Array.isArray(body.left) ? body.left : [];
    const right = Array.isArray(body.right) ? body.right : [];
    return (
      <div className="canvas">
        <h2 className="canvas-heading">{slide.title}</h2>
        <div className="canvas-columns">
          <div>
            {body.left_title ? <h3>{String(body.left_title)}</h3> : null}
            <ul>
              {left.map((item, i) => (
                <li key={i}>{String(item)}</li>
              ))}
            </ul>
          </div>
          <div>
            {body.right_title ? <h3>{String(body.right_title)}</h3> : null}
            <ul>
              {right.map((item, i) => (
                <li key={i}>{String(item)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const bullets = Array.isArray(body.bullets) ? body.bullets : [];
  return (
    <div className="canvas">
      <h2 className="canvas-heading">{slide.title}</h2>
      <ul className="canvas-bullets">
        {bullets.map((item, i) => (
          <li key={i}>{String(item)}</li>
        ))}
      </ul>
    </div>
  );
}
