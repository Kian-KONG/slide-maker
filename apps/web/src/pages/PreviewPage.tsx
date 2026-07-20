import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import { api } from "../api/client";
import {
  buildRevealDocument,
  downloadHtml,
  revealThemeCss,
  sanitizeFilename,
  slideSectionHtml,
} from "../lib/revealExport";
import type { ProjectDetail } from "../types";

export default function PreviewPage() {
  const { id = "" } = useParams();
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<Reveal.Api | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.getProject(id);
      setDetail(d);
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
    if (!detail || !deckRef.current) return;
    const slidesEl = deckRef.current.querySelector(".slides");
    if (!slidesEl) return;
    slidesEl.innerHTML = detail.slides.map(slideSectionHtml).join("\n");

    let cancelled = false;

    async function boot() {
      if (revealRef.current) {
        revealRef.current.destroy();
        revealRef.current = null;
      }
      const deck = new Reveal(deckRef.current!, {
        embedded: true,
        hash: false,
        slideNumber: "c/t",
        width: 1280,
        height: 720,
        margin: 0.04,
        transition: "fade",
        backgroundTransition: "fade",
      });
      await deck.initialize();
      if (cancelled) {
        deck.destroy();
        return;
      }
      revealRef.current = deck;
    }

    void boot();

    return () => {
      cancelled = true;
      if (revealRef.current) {
        revealRef.current.destroy();
        revealRef.current = null;
      }
    };
  }, [detail]);

  async function handleExport() {
    if (!detail) return;
    setError(null);
    setExportMsg(null);
    try {
      const html = buildRevealDocument(detail.project.title, detail.slides);
      downloadHtml(sanitizeFilename(detail.project.title), html);
      const saved = await api.exportHtml(id, html);
      setExportMsg(`Saved to content/decks/${saved.slug}/slides.html`);
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

  const total = detail.slides.length;

  return (
    <div className="page page-wide">
      <style>{revealThemeCss}</style>
      <header className="page-header">
        <div className="header-title-row">
          <Link className="btn" to={`/projects/${id}`}>
            Edit
          </Link>
          <h1>{detail.project.title}</h1>
        </div>
        <div className="header-actions">
          <span className="muted">{total} slides · Reveal.js</span>
          <button type="button" className="btn primary" onClick={() => void handleExport()}>
            Export HTML
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {exportMsg && <p className="muted">{exportMsg}</p>}

      {total === 0 ? (
        <p className="muted">No slides to preview.</p>
      ) : (
        <div className="reveal-frame">
          <div className="reveal" ref={deckRef}>
            <div className="slides" />
          </div>
        </div>
      )}
    </div>
  );
}
