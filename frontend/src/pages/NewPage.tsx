import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function NewPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rawNotes.trim()) {
      setError("Notes are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body: { title?: string; raw_notes: string } = {
        raw_notes: rawNotes,
      };
      if (title.trim()) body.title = title.trim();
      const result = await api.expand(body);
      navigate(`/projects/${result.project.id}/expand`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>New project</h1>
        <Link className="btn" to="/">
          Back
        </Link>
      </header>

      <p className="muted step-hint">
        Step 1 · Paste raw notes. Next you will review an expanded narrative and outline before slides are generated.
      </p>

      <form className="form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="field">
          <span>Title (optional)</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            disabled={loading}
          />
        </label>

        <label className="field">
          <span>Raw notes</span>
          <textarea
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="Paste source notes here (kept verbatim)…"
            rows={12}
            required
            disabled={loading}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Expanding…" : "Expand & continue"}
        </button>
      </form>
    </div>
  );
}
