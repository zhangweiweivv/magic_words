# Poetry ArticleView — 线装古籍/宣纸感（楷体 WebFont 自托管）Design

**Goal:** 让 `ArticleView`（读正文页）更有“书香气/古籍感”，通过：
- 标题体系使用“楷体/文楷风格”字体（自托管 WebFont，跨设备一致）
- 背景加入极轻的宣纸纹理（纯 CSS，无图片）
- 正文容器更像“书页”（边框/内阴影/装订线/分隔纹样）

**Non-goals**
- 不引入完整 Markdown 渲染器（仍保持当前“固定章节抽取 + 克制净化”的策略）。
- 不改变学习语义/接口。

---

## Font strategy
- **Body（正文）**：继续使用现有 `Noto Serif SC`（可读性稳定）。
- **Title system（标题体系）**：引入 *霞鹜文楷（LXGW WenKai）*（仅用于）：
  - 文章大标题（`h1`）
  - section 标题（原文/注释/译文/赏析 `h3`）
  - 章节小标题（（一）（二） `.content-heading`）

### Loading (B1 自托管)
- 将字体文件放入 `apps/poetry/client/src/fonts/`：
  - `LXGWWenKai-Regular.woff2`
  - `LXGWWenKai-Bold.woff2`（或 SemiBold 视可用性）
- 使用 `@font-face` 在全局样式中注册 `font-family: 'LXGW WenKai'`。
- 同时纳入字体许可文件（OFL）到仓库，确保合规。

---

## Visual design (paper & binding)
### Paper texture (CSS only)
- `body` 背景在 `--paper-cream` 基础上叠加极淡纹理：
  - repeating-linear-gradient 形成细纤维感
  - radial-gradient 形成轻噪点感
- 目标：仅“有纸感”，不抢正文。

### Page frame
- `article-content` 作为“书页”：
  - 更白的纸色 + 细边框 + 轻微内阴影
  - 左侧一条淡淡“装订线”（pseudo-element）
- Header 与正文之间增加“纹样分隔线”（纯 CSS 或内联 SVG）。

---

## Acceptance criteria
- 标题/小标题一眼有楷体书卷气（跨设备一致）。
- 详情页背景与正文容器有明显“纸页”质感，但不花哨。
- 功能与交互保持不变（chips、完成按钮等仍正常）。

---

## Testing
- 因为字体与纯 CSS 纹理难以做像素级测试，采用“结构性测试”保证关键挂载点存在：
  - `h1` 具备 `article-title` class
  - section `h3` 具备 `section-title` class
  - `.content-heading` 继续存在
- Vitest 覆盖上述 class/结构，避免未来重构误删导致字体策略失效。
