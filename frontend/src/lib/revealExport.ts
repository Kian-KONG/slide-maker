import type { SlideOut } from "../types";

const REVEAL_VERSION = "5.2.1";
const CDN = `https://cdn.jsdelivr.net/npm/reveal.js@${REVEAL_VERSION}`;

function esc(text: unknown): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listItems(items: unknown): string {
  if (!Array.isArray(items)) return "";
  return items
    .filter((x) => String(x).trim() !== "")
    .map((x) => `<li>${esc(x)}</li>`)
    .join("");
}

export function slideSectionHtml(slide: SlideOut): string {
  const body = slide.body || {};
  const title = esc(slide.title);

  if (slide.layout === "title" || slide.layout === "section") {
    const sub = body.subtitle ? `<p class="sub">${esc(body.subtitle)}</p>` : "";
    return `<section class="layout-${slide.layout}" data-layout="${slide.layout}">
  <div class="rail"></div>
  <div class="inner">
    <h1 class="t">${title}</h1>
    ${sub}
  </div>
</section>`;
  }

  if (slide.layout === "two_column") {
    const leftT = esc(body.left_title || "");
    const rightT = esc(body.right_title || "");
    return `<section class="layout-two-column" data-layout="two_column">
  <div class="accent-bar"></div>
  <h2 class="h">${title}</h2>
  <div class="rule"></div>
  <div class="cols">
    <div class="card"><h3>${leftT}</h3><ul>${listItems(body.left)}</ul></div>
    <div class="card"><h3>${rightT}</h3><ul>${listItems(body.right)}</ul></div>
  </div>
</section>`;
  }

  return `<section class="layout-bullets" data-layout="bullets">
  <div class="accent-bar"></div>
  <h2 class="h">${title}</h2>
  <div class="rule"></div>
  <ul class="bullets">${listItems(body.bullets)}</ul>
</section>`;
}

/** Theme CSS aligned with deck-aesthetic (paper / ink / accent). */
export const revealThemeCss = `
:root {
  --ink: #14161c;
  --muted: #4a505c;
  --paper: #f7f4ee;
  --accent: #c45c26;
  --line: #d9d2c5;
  --white: #fff;
  --sans: "Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}
.reveal {
  font-family: var(--sans);
  color: var(--ink);
  background: #0f1115;
}
.reveal .slides {
  text-align: left;
}
.reveal .slides section {
  background: var(--paper);
  color: var(--ink);
  padding: 4.2% 5.2% 5.5%;
  box-sizing: border-box;
  height: 100%;
}
.reveal .accent-bar {
  position: absolute; left: 0; top: 0; right: 0; height: 6px; background: var(--accent);
}
.reveal .rule {
  height: 1px; background: var(--line); margin: 0 0 1.35rem;
}
.reveal .rail {
  position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: var(--ink);
}
.reveal .layout-title .inner,
.reveal .layout-section .inner {
  display: flex; flex-direction: column; justify-content: center;
  height: 100%; padding-left: 1.2rem; box-sizing: border-box;
}
.reveal .layout-section {
  background: var(--ink) !important; color: var(--white);
  padding: 0 !important;
}
.reveal .layout-section .rail { background: var(--accent); width: 8px; }
.reveal .layout-section .inner {
  background: var(--ink); padding: 8% 8% 8% 7%;
}
.reveal .layout-section .sub { color: #e8d5c4; }
.reveal .t {
  margin: 0; font-size: 2.6rem; font-weight: 700; line-height: 1.12; letter-spacing: -0.02em;
}
.reveal .sub {
  margin: 1rem 0 0; font-size: 1.25rem; color: var(--muted); max-width: 38rem; line-height: 1.45;
}
.reveal .h {
  margin: 1.1rem 0 0.85rem; font-size: 1.85rem; font-weight: 700; letter-spacing: -0.015em;
}
.reveal .bullets {
  margin: 0; padding-left: 1.15rem; font-size: 1.2rem; line-height: 1.5;
}
.reveal .bullets li { margin: 0 0 0.75rem; }
.reveal .cols {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.35rem;
}
.reveal .card {
  background: var(--white); border: 1px solid var(--line); border-radius: 10px;
  padding: 1.15rem 1.2rem 1.25rem;
}
.reveal .card h3 {
  margin: 0 0 0.85rem; font-size: 0.92rem; color: var(--accent);
  letter-spacing: 0.04em; font-weight: 650;
}
.reveal .card ul {
  margin: 0; padding-left: 1.1rem; font-size: 1.05rem; line-height: 1.45;
}
.reveal .card li { margin: 0 0 0.55rem; }
.reveal .controls, .reveal .progress { color: var(--accent); }
`;

export function buildRevealDocument(title: string, slides: SlideOut[]): string {
  const sections = slides.map(slideSectionHtml).join("\n");
  const deckTitle = esc(title);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${deckTitle}</title>
<link rel="stylesheet" href="${CDN}/dist/reveal.css"/>
<style>${revealThemeCss}</style>
</head>
<body>
<div class="reveal">
  <div class="slides">
${sections}
  </div>
</div>
<script src="${CDN}/dist/reveal.js"></script>
<script>
Reveal.initialize({
  hash: true,
  slideNumber: "c/t",
  width: 1280,
  height: 720,
  margin: 0.04,
  transition: "fade",
  backgroundTransition: "fade"
});
</script>
</body>
</html>`;
}

export function downloadHtml(filename: string, html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(title: string): string {
  const name =
    title
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .trim()
      .replace(/[. ]+$/g, "") || "presentation";
  return `${name}.html`;
}
