"""Build a self-contained HTML slide deck (no PowerPoint)."""

from __future__ import annotations

import html
import re
from urllib.parse import quote

from app.schemas import SlideOut


def sanitize_filename(title: str) -> str:
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", title).strip() or "presentation"
    name = name.rstrip(". ")
    return f"{name}.html"


def content_disposition(filename: str) -> str:
    ascii_name = filename.encode("ascii", "ignore").decode("ascii").strip() or "presentation.html"
    ascii_name = re.sub(r"[\\\"]", "_", ascii_name)
    utf8_name = quote(filename, safe="")
    return f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{utf8_name}"


def _esc(text: object) -> str:
    return html.escape(str(text), quote=True)


def _list_items(items: object) -> str:
    if not isinstance(items, list):
        return ""
    return "".join(f"<li>{_esc(x)}</li>" for x in items if str(x).strip() != "")


def _slide_html(slide: SlideOut, index: int) -> str:
    body = slide.body or {}
    layout = slide.layout
    title = _esc(slide.title)

    if layout in ("title", "section"):
        sub = _esc(body.get("subtitle") or "")
        inner = f'<h1 class="t">{title}</h1>'
        if sub:
            inner += f'<p class="sub">{sub}</p>'
        cls = f"slide {layout}"
    elif layout == "two_column":
        left_t = _esc(body.get("left_title") or "")
        right_t = _esc(body.get("right_title") or "")
        left = _list_items(body.get("left"))
        right = _list_items(body.get("right"))
        inner = (
            f'<h2 class="h">{title}</h2><div class="cols">'
            f'<div><h3>{left_t}</h3><ul>{left}</ul></div>'
            f'<div><h3>{right_t}</h3><ul>{right}</ul></div></div>'
        )
        cls = "slide two-col"
    else:
        bullets = _list_items(body.get("bullets"))
        inner = f'<h2 class="h">{title}</h2><ul class="bullets">{bullets}</ul>'
        cls = "slide bullets"

    return f'<section class="{cls}" data-i="{index}" aria-label="Slide {index + 1}">{inner}</section>'


def build_html(title: str, slides: list[SlideOut]) -> str:
    slides_html = "\n".join(_slide_html(s, i) for i, s in enumerate(slides))
    deck_title = _esc(title)
    n = len(slides)
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{deck_title}</title>
<style>
:root {{
  --ink:#14161c; --muted:#4a505c; --paper:#f7f4ee; --accent:#c45c26; --line:#d9d2c5; --white:#fff;
  --sans:"Helvetica Neue",Helvetica,Arial,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
}}
* {{ box-sizing:border-box; }}
html,body {{ margin:0; height:100%; background:#0f1115; color:var(--ink); font-family:var(--sans); }}
.deck {{ height:100%; position:relative; overflow:hidden; }}
.slide {{
  display:none; position:absolute; inset:0; margin:auto;
  width:min(100vw, calc(100vh * 16 / 9)); height:min(100vh, calc(100vw * 9 / 16));
  background:var(--paper); padding:4.5% 5.5%; overflow:auto;
}}
.slide.active {{ display:flex; flex-direction:column; }}
.slide.title, .slide.section {{ align-items:flex-start; justify-content:center; }}
.slide.section {{ background:var(--ink); color:var(--white); }}
.slide.section .sub {{ color:#e8d5c4; }}
.t {{ margin:0; font-size:clamp(2rem,5vw,3.2rem); font-weight:700; line-height:1.15; }}
.sub {{ margin:.9rem 0 0; font-size:clamp(1rem,2.2vw,1.35rem); color:var(--muted); max-width:40rem; }}
.h {{ margin:0 0 1.4rem; font-size:clamp(1.4rem,3vw,2rem); font-weight:700; }}
.bullets, .cols ul {{ margin:0; padding-left:1.2rem; font-size:clamp(1rem,2vw,1.35rem); line-height:1.45; }}
.bullets li, .cols li {{ margin:0 0 .7rem; }}
.cols {{ display:grid; grid-template-columns:1fr 1fr; gap:2.5rem; flex:1; }}
.cols h3 {{ margin:0 0 .8rem; font-size:.95rem; color:var(--accent); letter-spacing:.02em; }}
.bar {{
  position:fixed; left:0; right:0; bottom:0; z-index:5;
  display:flex; align-items:center; justify-content:space-between; gap:1rem;
  padding:.55rem 1rem; background:rgba(15,17,21,.82); color:#e8e6e1; font-size:.85rem;
  backdrop-filter:blur(6px);
}}
.bar button {{
  font:inherit; color:inherit; background:transparent; border:1px solid #3a3f4a;
  border-radius:6px; padding:.3rem .7rem; cursor:pointer;
}}
.bar button:hover {{ background:#232733; }}
.bar .meta {{ opacity:.85; }}
@media print {{
  html,body,.deck {{ height:auto; background:#fff; }}
  .bar {{ display:none; }}
  .slide {{
    display:flex !important; position:relative; page-break-after:always;
    width:100%; height:auto; min-height:100vh; inset:auto;
  }}
}}
</style>
</head>
<body>
<div class="deck" id="deck">
{slides_html or '<section class="slide title active"><h1 class="t">Empty deck</h1></section>'}
</div>
<div class="bar">
  <div>
    <button type="button" id="prev" aria-label="Previous">←</button>
    <button type="button" id="next" aria-label="Next">→</button>
  </div>
  <div class="meta"><span id="pos">1</span> / {n} · {deck_title} · ←/→ 翻页 · P 打印</div>
</div>
<script>
(function(){{
  const slides=[...document.querySelectorAll('.slide')];
  let i=0;
  function show(n){{
    if(!slides.length) return;
    i=(n+slides.length)%slides.length;
    slides.forEach((s,k)=>s.classList.toggle('active',k===i));
    const pos=document.getElementById('pos');
    if(pos) pos.textContent=String(i+1);
  }}
  document.getElementById('prev')?.addEventListener('click',()=>show(i-1));
  document.getElementById('next')?.addEventListener('click',()=>show(i+1));
  window.addEventListener('keydown',(e)=>{{
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){{ e.preventDefault(); show(i+1); }}
    if(e.key==='ArrowLeft'||e.key==='PageUp'){{ e.preventDefault(); show(i-1); }}
    if(e.key==='p'||e.key==='P') window.print();
    if(e.key==='Home') show(0);
    if(e.key==='End') show(slides.length-1);
  }});
  show(0);
}})();
</script>
</body>
</html>
"""


def build_html_bytes(title: str, slides: list[SlideOut]) -> bytes:
    return build_html(title, slides).encode("utf-8")


def slides_from_dicts(items: list[dict]) -> list[SlideOut]:
    """Helper for offline deck scripts."""
    out: list[SlideOut] = []
    for i, item in enumerate(items):
        out.append(
            SlideOut(
                id=str(item.get("id") or i),
                project_id="offline",
                position=i,
                layout=item.get("layout") or "bullets",
                title=str(item.get("title") or ""),
                body=item.get("body") or {},
            )
        )
    return out
