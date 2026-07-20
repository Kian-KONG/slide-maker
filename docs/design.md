# Slide Maker 设计文档

日期：2026-07-17  
状态：待用户确认

## 1. 目标

把杂乱的**会议摘要/笔记**半自动变成可编辑、可预览、可下载的 PPT Web 应用。

核心流程：

1. 用户粘贴会议笔记（原文入库，`notes.md`）  
2. LLM **扩写重构** → `expanded.md` + 章节大纲（可人工改）  
3. 基于扩写稿生成幻灯片大纲（不用原文直接出片）  
4. 浏览器精修 / 预览 → 导出 `.html`  
5. 项目持久化到 SQLite，可再次打开编辑

## 2. 非目标（第一版不做）

- 用户登录 / 多租户权限  
- 多人实时协作  
- 复杂主题商店 / 品牌模板市场  
- 本地 Ollama（第一版仅云端 OpenAI 兼容 API）  
- Next.js / SSR  
- 自动生成配图、图表动画

## 3. 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 前端 | Vite + React + React Router | SPA，不做 Next.js |
| 后端 | FastAPI (Python) | LLM、SQLite、导出 |
| 数据库 | SQLite | 轻量，文件位于 `backend/data/slide_maker.db` |
| HTML 导出 | 服务端生成自包含 `.html` | 键盘翻页；打印即 PDF |
| LLM | OpenAI 兼容 HTTP API | Key / Base URL / Model 放 `.env` |

## 4. 架构

```
Browser (React Router SPA)
  ├── /                 项目列表
  ├── /new              粘贴笔记 → 触发结构化
  ├── /projects/:id     编辑大纲
  └── /projects/:id/preview  预览
         │
         │  REST JSON
         ▼
FastAPI
  ├── structure  → LLM → slides 落库
  ├── projects CRUD + slides 更新
  └── export     → HTML deck → 文件下载
         │
         ▼
SQLite (projects, slides)
```

API Key **仅存在于后端 `.env`**，不暴露给前端。

## 5. 页面与交互

### 5.1 路由

| 路径 | 页面 | 行为 |
|------|------|------|
| `/` | 列表 | 展示项目标题、更新时间；进入编辑 / 删除 |
| `/new` | 新建 | 大文本框粘贴笔记；可选标题；提交后调用结构化 API，成功跳转 `/projects/:id` |
| `/projects/:id` | 编辑 | 左侧页列表（上移/下移调序即可；可选拖拽），右侧编辑当前页；保存；链到预览；导出按钮 |
| `/projects/:id/preview` | 预览 | 按页展示接近导出效果的幻灯片；可返回编辑或导出 |

### 5.2 幻灯片 layout 类型（第一版）

| layout | 用途 | body 字段约定 |
|--------|------|----------------|
| `title` | 封面 | `{ "subtitle": "..." }` |
| `section` | 章节分隔 | `{ "subtitle": "..." }`（可选） |
| `bullets` | 要点页 | `{ "bullets": ["...", "..."] }` |
| `two_column` | 双栏对比 | `{ "left": [...], "right": [...], "left_title": "", "right_title": "" }` |

LLM 只能输出上述 layout；未知 layout 在入库前归一为 `bullets`。

### 5.3 编辑能力（第一版）

- 改项目标题、页标题、body  
- 增删页、调序  
- 切换 layout（切换时给出空的默认 body）  
- 整表保存（`PUT /slides`）

## 6. 数据模型

### 6.1 `projects`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| title | TEXT | 展示标题 |
| raw_notes | TEXT | 原始会议笔记 |
| created_at | TEXT | ISO8601 |
| updated_at | TEXT | ISO8601 |

### 6.2 `slides`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| project_id | TEXT FK | → projects.id ON DELETE CASCADE |
| position | INTEGER | 从 0 起的顺序 |
| layout | TEXT | title / section / bullets / two_column |
| title | TEXT | 页标题 |
| body | TEXT | JSON 字符串 |

索引：`(project_id, position)`。

## 7. API

统一前缀：`/api`。错误返回 `{ "detail": "..." }`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 列表：`[{ id, title, updated_at }]` |
| POST | `/api/projects` | 可选：创建空项目 `{ title?, raw_notes? }` |
| GET | `/api/projects/{id}` | 详情：`{ project, slides }` |
| PATCH | `/api/projects/{id}` | 更新 `{ title? }` |
| DELETE | `/api/projects/{id}` | 删除项目及 slides |
| POST | `/api/structure` | 见下（独立路径，避免与 `{id}` 冲突） |
| PUT | `/api/projects/{id}/slides` | 整表替换 slides |
| POST | `/api/projects/{id}/export` | 返回 `text/html` 自包含幻灯片 |

### 7.1 `POST /api/structure`

请求：

```json
{
  "title": "可选，空则由模型生成",
  "raw_notes": "会议笔记全文"
}
```

行为：

1. 调用 LLM，要求输出严格 JSON：`{ "title": "...", "slides": [ { "layout", "title", "body" } ] }`  
2. 校验 layout / body；失败则 422 或带可重试信息的 502  
3. 写入 `projects` + `slides`  
4. 返回完整 `{ project, slides }`

### 7.2 LLM 配置（`.env`）

```env
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
DATABASE_URL=sqlite:///./data/slide_maker.db
CORS_ORIGINS=http://localhost:5173
```

使用 OpenAI 兼容的 `/chat/completions`；`LLM_BASE_URL` 可换成国内或其他兼容网关。

### 7.3 结构化 Prompt 原则

- 从杂乱笔记中提炼**主题板块**，而非逐句照抄  
- 每页一个信息焦点；要点短句，避免长段  
- 优先：封面 → 若干 section + bullets →（可选）总结页  
- 保留原意中的关键术语、人名、产品名；不编造笔记中没有的事实  
- 输出必须是可解析 JSON，无 markdown 围栏

## 8. 导出（HTML）

- 按 `position` 顺序渲染为自包含 `.html`  
- 统一简洁模板：纸色底、深色标题、要点列表；`two_column` 左右分栏；section 深色分隔  
- 键盘 ←/→ 翻页；`P` 打开打印（可另存 PDF）  
- 文件名：`{title}.html`（非法字符替换；`Content-Disposition` 支持 UTF-8）  
- 不依赖 PowerPoint / Keynote

## 9. 目录结构

```
slide-maker/
├── frontend/
│   ├── src/
│   │   ├── pages/           # ListPage, NewPage, EditPage, PreviewPage
│   │   ├── api/             # fetch 封装
│   │   ├── types.ts
│   │   ├── App.tsx          # React Router
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts       # /api 代理到后端
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── db.py
│   │   ├── schemas.py
│   │   ├── routers/
│   │   │   ├── projects.py
│   │   │   ├── structure.py
│   │   │   └── export.py
│   │   └── services/
│   │       ├── llm.py
│   │       └── html_export.py
│   ├── data/                # gitignore：*.db
│   ├── requirements.txt
│   └── .env.example
├── content/
│   ├── notes/
│   └── decks/               # standalone .html
├── docs/
├── README.md
└── .gitignore
```

本地开发：

- `make install` 然后 `make start`  
- 或：前端 `npm run dev`（5173）+ 后端 `uvicorn app.main:app --reload --port 8000`

## 10. 示例输入（验收用）

用户提供的会议摘要（教育 / 物理智能 / 青年与 AI / 光电与算力 / 欧莱雅 / 王坚与科学数据 / 医学智能 / 世界模型与具身 / 普惠安全等板块）作为第一版结构化质量的手工验收样例：粘贴全文 → 检查是否按主题分节、要点是否可读、导出 HTML 页序是否合理。

## 11. 成功标准（第一版）

1. 配置 `.env` 后，粘贴样例笔记可生成可编辑项目  
2. 编辑后刷新仍在（SQLite）  
3. 预览页内容与编辑一致  
4. 导出的 `.html` 可在浏览器打开翻页，并可打印为 PDF  
5. 无 API Key 时结构化接口返回明确错误，不泄露堆栈给前端

## 12. 后续可选（不做进第一版）

- 主题/品牌色配置  
- 导出改调高级排版或图表  
- 支持 Ollama  
- 简单账号体系  
- 沉淀为 Cursor Skill，封装「按本项目约定调用/扩展」
