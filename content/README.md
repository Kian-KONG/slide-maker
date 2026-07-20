# Content

会议笔记与 HTML 幻灯片。流水线：**原文 → 扩写 → 确认大纲 → 出片**。

## 布局

```
content/
├── notes/                          # 人工整理的源笔记（可选归档）
└── decks/
    └── <slug>/
        ├── notes.md                # 原文 raw
        ├── expanded.md             # 扩写稿（slides 的唯一文本来源）
        ├── slides.html             # 浏览器翻页演示
        └── meta.json               # title / outline / slide_count / pipeline
```

应用流程：

1. `/new` 粘贴原文 → `POST /api/expand`
2. `/projects/:id/expand` 改扩写稿与大纲 → `PATCH .../expanded`
3. 生成幻灯片 → `POST .../generate`
4. 编辑 / 预览 / Export HTML（同时写入上述目录）

```bash
make decks   # 重建手工大纲 HTML（离线脚本）
```
