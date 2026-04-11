# 可可古诗文（Poetry）

这是“可可晨读计划”的古诗文学习网站：
- 面向可可：学新篇、按艾宾浩斯复习、查看“征服进度”
- 面向家长：家长中心可调整每篇文章/按难度等级的复习计划（并保证 override 永远优先）

本 README 同时包含：*开发者本地运行* 与 *本机部署/运维*。

---

## 1. 目录结构

- `apps/poetry/server/`：Express 后端（API + 托管前端 build）
- `apps/poetry/client/`：Vue3 + Vite 前端
- `apps/poetry/scripts/`：辅助脚本（如有）

---

## 2. 核心概念（非常重要）

### 2.1 文章目录（Catalog）
- 目录来自 Obsidian：`小红本/` 下的 `*.md`（例如：`小红本/寅集.md`）
- 每个“集”文件里按 `##` 分题材，再用 Markdown 表格列文章。

### 2.2 学习状态（State）与审计日志（Events）
每篇文章独立一套艾宾浩斯状态机：
- 状态文件：`STATE_ROOT/{articleId}.json`
- 事件日志：`STATE_ROOT/{articleId}.events.jsonl`（append-only）

> 关键原则：任何页面展示的“学习状态”都以 state 文件为单一事实来源；
> 并且 admin 列表与 progress 列表复用同一套投影逻辑（避免漂移），同时有 contract test 防回归。

### 2.3 艾宾浩斯参数
- `totalStages`：总复习轮次
- `intervals[]`：每一轮完成后到下一轮的间隔天数

重要校验：
- `intervals.length >= totalStages`（否则会产生 active 但 nextDueDate 为 null 的“孤儿状态”）

### 2.4 override 优先级（家长中心核心规则）
- 每篇文章 state 有字段：`scheduleSource: 'level_default'|'override'`
- 单篇调参会写 `override`，并且**永远不会**被“按难度等级统一调参”覆盖
- 可随时“重置为默认”回到 `level_default`

---

## 3. 本地开发（开发者）

### 3.1 后端（server）

```bash
cd apps/poetry/server
npm install
npm test
npm run dev
```

默认端口：`3002`（可通过 `POETRY_PORT` 覆盖）

健康检查：
- <http://localhost:3002/health>

### 3.2 前端（client）

```bash
cd apps/poetry/client
npm install
npm test
npm run dev
```

构建：
```bash
npm run build
```

> 线上由 server 托管 `client/dist`。

---

## 4. 主要页面与功能

- `/`：HomeView（今日待复习、最近一次学习、下一篇推荐、入口导航）
- `/article/:articleId`：ArticleView（正文 + 开始/复习）
- `/detail/:articleId`：ArticleDetailView（学习记录/详情）
- `/parent`：ParentView（家长中心：调参、按集查看、单篇 override/reset、梅花雨开关等）
- `/progress`：ProgressView（可可进度页：整体统计 + 每集统计 + 全量文章列表）

---

## 5. API 速查

### 5.1 学习状态
- `GET /api/state/due`：今日待复习
- `GET /api/state/current`：最近一次学习（按 events 最新 timestamp）
- `GET /api/state/:articleId`：单篇状态 + events
- `POST /api/state/:articleId/complete`：完成一轮（首次会自动 start）
- `POST /api/state/:articleId/defer`：延期到明天

### 5.2 推荐
- `GET /api/recommend/next`：下一篇推荐（只读 peek，不推进轮询游标）

### 5.3 家长中心（Admin）
- `GET /api/admin/difficulty/rules`
- `GET /api/admin/collections`
- `GET /api/admin/collection/:collection/articles`
- `PUT /api/admin/difficulty/:level`（可 applyToExisting，且跳过 override）
- `PUT /api/admin/article/:articleId/override`
- `PUT /api/admin/article/:articleId/reset-to-default`

### 5.4 可可进度页（聚合）
- `GET /api/progress/overview`

---

## 6. 数据路径与环境变量（部署/运维）

### 6.1 Obsidian 根目录
默认：`/Users/vvhome/vv_obsidian/vv_obsidian`

可通过环境变量覆盖：
- `POETRY_OBSIDIAN_BASE`：Obsidian vault 根目录

server 会从该根目录推导：
- `CONTENT_ROOT = {POETRY_OBSIDIAN_BASE}/小红本`
- `STATE_ROOT = {POETRY_OBSIDIAN_BASE}/可可pet/可可古诗文`

### 6.2 端口
- `POETRY_PORT`：服务端口（默认 3002）

### 6.3 Slack 通知（如启用）
依赖环境/配置（具体以 `apps/poetry/server/services/slack.js` 为准）。

---

## 7. 本机部署（LaunchAgent）

当前 Poetry 以 macOS LaunchAgent 方式常驻（服务名：`com.keke.poetry`）。

常用操作：

```bash
# 停止
launchctl unload ~/Library/LaunchAgents/com.keke.poetry.plist

# 启动
launchctl load ~/Library/LaunchAgents/com.keke.poetry.plist

# 验证
curl -sS http://localhost:3002/health
```

发布流程（推荐）：
1) 合并 PR 后 `git pull`
2) `apps/poetry/client npm test && npm run build`
3) 重启 `com.keke.poetry`
4) health check

---

## 8. 测试策略（正确性保障）

- server：`node:test` 覆盖状态机、配置变更、difficulty defaults、admin API、progress API
- client：`vitest` 覆盖关键页面渲染与交互
- 强约束：存在 contract test，保证 `/api/state/:id`、`/api/admin/...articles`、`/api/progress/overview` 的关键字段一致

---

## 9. 常见问题（Troubleshooting）

- 端口占用（EADDRINUSE）：检查是否有残留 node 进程占用 3002。
- 页面数据不更新：确认 build 已生成到 `apps/poetry/client/dist`，并重启 LaunchAgent。
