import { config } from "../config.js";
import type { OutlineItem } from "../db.js";
import type { Layout, SlideIn } from "../repo.js";

const ALLOWED = new Set(["title", "section", "bullets", "two_column"]);

function expandSystem(): string {
  return `You expand messy meeting notes into a speakable narrative for a presentation.
Return ONLY valid JSON (no markdown fences):
{
  "title": "deck title",
  "expanded_notes": "full markdown string",
  "outline": [{"title": "chapter", "intent": "one-line purpose"}]
}

Hard rules (expand-narrative):
- Keep names, numbers, product names, metaphors from the notes. Do NOT invent facts, metrics, quotes, or events.
- Add connective logic and speaker-ready phrasing only ("so what?", transitions). Prefer one clear narrative arc.
- expanded_notes: markdown with elevator summary then H2 sections; speakable, dense bullets; cull filler and repetition.
- outline: TARGET ${config.maxOutlineChapters} chapters max (prefer 4–${config.maxOutlineChapters}). Merge semantically similar themes into one chapter (e.g. brand perception + entry points; talent + creativity).
- Order for speaking: open → body → close. Do not mirror note-taking order if it is fragmented.
`;
}

function slidesSystem(): string {
  return `You turn an EXPANDED markdown narrative (+ optional outline) into presentation slides.
Return ONLY valid JSON (no markdown fences):
{"title": "...", "slides": [{"layout": "...", "title": "...", "body": {}}]}

Hard rules:
- Build slides from the expanded narrative only.
- TOTAL slides MUST be ≤ ${config.maxSlides} (including cover and closing). Prefer ${Math.min(10, config.maxSlides)}–${config.maxSlides}.
- Allowed layouts: title, section, bullets, two_column
- body title/section: {"subtitle": "..."}
- body bullets: {"bullets": ["...", "..."]} — use 5–8 dense points per content slide (conclusion + evidence where possible)
- body two_column: {"left": [...], "right": [...], "left_title": "", "right_title": ""} — prefer for contrasts
- Follow outline order when provided, but MERGE near-duplicate chapters. Do NOT emit one section + many pages per chapter.
- Use at most 2–3 section dividers for the whole deck. Prefer high-density bullets/two_column over many thin slides.
- Cover first; short closing last; no emoji; do not invent facts beyond the expanded text.
`;
}

function stripFences(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return t.trim();
}

function httpError(statusCode: number, detail: string): Error {
  const err = new Error(detail);
  (err as Error & { statusCode: number }).statusCode = statusCode;
  return err;
}

async function chat(
  messages: { role: string; content: string }[],
  temperature = 0.3,
): Promise<unknown> {
  if (!config.llmApiKey) {
    throw httpError(503, "LLM_API_KEY is not configured");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.llmTimeoutMs);
  try {
    const res = await fetch(`${config.llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.llmApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages,
        temperature,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw httpError(502, `LLM request failed with status ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw httpError(504, "LLM request timed out");
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseJsonContent(data: unknown): Record<string, unknown> {
  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw httpError(502, "LLM returned empty response");
  }
  try {
    const parsed = JSON.parse(stripFences(content));
    if (!parsed || typeof parsed !== "object") {
      throw httpError(502, "LLM returned invalid JSON");
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    if ((e as Error & { statusCode?: number }).statusCode) throw e;
    throw httpError(502, "LLM returned invalid JSON");
  }
}

function normalizeBody(layout: string, body: unknown): Record<string, unknown> {
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (layout === "title" || layout === "section") {
    return { subtitle: String(b.subtitle ?? "") };
  }
  if (layout === "two_column") {
    const left = Array.isArray(b.left) ? b.left.map(String) : [];
    const right = Array.isArray(b.right) ? b.right.map(String) : [];
    return {
      left,
      right,
      left_title: String(b.left_title ?? ""),
      right_title: String(b.right_title ?? ""),
    };
  }
  const bullets = Array.isArray(b.bullets) ? b.bullets.map(String) : [];
  return { bullets };
}

function normalizeSlides(raw: unknown): SlideIn[] {
  if (!Array.isArray(raw)) return [];
  const slides: SlideIn[] = [];
  raw.forEach((item, i) => {
    if (!item || typeof item !== "object") return;
    const obj = item as Record<string, unknown>;
    let layout = String(obj.layout || "bullets");
    if (!ALLOWED.has(layout)) layout = "bullets";
    slides.push({
      position: i,
      layout: layout as Layout,
      title: String(obj.title ?? ""),
      body: normalizeBody(layout, obj.body),
    });
  });
  return slides;
}

function normalizeOutline(raw: unknown): OutlineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === "object")
    .map((x) => ({
      title: String((x as OutlineItem).title || "").trim(),
      intent: String((x as OutlineItem).intent || "").trim(),
    }))
    .filter((x) => x.title)
    .slice(0, config.maxOutlineChapters);
}

export type ExpandLLMResult = {
  title: string;
  expanded_notes: string;
  outline: OutlineItem[];
};

export type StructureLLMResult = {
  title: string;
  slides: SlideIn[];
};

export async function expandNotes(
  rawNotes: string,
  title?: string | null,
): Promise<ExpandLLMResult> {
  const parts = [`Meeting notes:\n${rawNotes}`];
  if (title) parts.unshift(`Preferred deck title: ${title}`);
  const data = await chat(
    [
      { role: "system", content: expandSystem() },
      { role: "user", content: parts.join("\n\n") },
    ],
    0.35,
  );
  const parsed = parseJsonContent(data);
  const deckTitle =
    (title || "").trim() ||
    String(parsed.title || "Untitled").trim() ||
    "Untitled";
  const expanded = String(parsed.expanded_notes || "").trim();
  if (!expanded) throw httpError(502, "LLM returned empty expanded_notes");
  return {
    title: deckTitle,
    expanded_notes: expanded,
    outline: normalizeOutline(parsed.outline),
  };
}

export async function slidesFromExpanded(
  expandedNotes: string,
  opts: { title?: string | null; outline?: OutlineItem[] } = {},
): Promise<StructureLLMResult> {
  if (!expandedNotes.trim()) {
    throw httpError(400, "expanded_notes is required before generating slides");
  }
  const parts = [`Expanded narrative:\n${expandedNotes}`];
  if (opts.outline?.length) {
    const lines = opts.outline
      .map((o) => `- ${o.title}${o.intent ? ` — ${o.intent}` : ""}`)
      .join("\n");
    parts.unshift(`Confirmed outline (follow this order; merge similar):\n${lines}`);
  }
  if (opts.title) parts.unshift(`Preferred deck title: ${opts.title}`);
  const data = await chat(
    [
      { role: "system", content: slidesSystem() },
      { role: "user", content: parts.join("\n\n") },
    ],
    0.25,
  );
  const parsed = parseJsonContent(data);
  const deckTitle =
    (opts.title || "").trim() ||
    String(parsed.title || "Untitled").trim() ||
    "Untitled";
  return {
    title: deckTitle,
    slides: normalizeSlides(parsed.slides),
  };
}
