# Portal 首页：可可周晨读计划浮动表 Design

**Goal**：在“可可魔法屋（Portal）”首页右下角增加一个可可可看的“周晨读计划”浮动卡片，展示固定时间段（07:15–07:35）以及每周各天对应学习内容。

**Constraints / Decisions（已确认）**
- 放置位置：方案 C（右下角 fixed 浮动卡片，尽量不遮挡主入口）
- 关闭行为：不记住（不写 localStorage；刷新/重开页面会再次出现）
- 内容固定：
  - 周一：语文美文
  - 周二：RAZ 英语阅读
  - 周三：语文古诗词
  - 周四：RAZ 英语阅读
  - 周五：语文美文
  - 周六：RAZ 英语阅读
  - 周日：语文古诗词
- 时间：07:15–07:35

---

## UX / UI 设计

### 1) 展示形态
- 默认：收起（只占用一行高度）
  - 标题：`🗓️ 晨读计划` + 时间 `07:15–07:35`
  - 按钮：`展开`（chevron）
- 展开后：显示“精美表格”（移动端友好）
  - 采用 CSS grid 做“表格感”：2 列（星期 / 内容）× 7 行
  - 每行有彩色 day badge + 内容文字（带小图标）
- 关闭（X）：仅本次页面生命周期隐藏（不持久化）

### 2) 位置与响应式
- 桌面/平板：右下角 fixed，宽度约 280–320px
- 手机：底部居中/左右留白（left/right 12px），避免挡住主要内容和手势

### 3) 视觉风格
- Portal 背景是深色渐变（城堡风），计划卡片使用“玻璃拟态”
  - 半透明背景 + 轻微 blur + 边框高光 + 阴影
- “精美点”的体现：
  - 表格行 hover（桌面）
  - 轻微分割线
  - Day badge 渐变/高亮

---

## 组件拆分

- 新组件：`apps/portal/client/src/components/WeeklyReadingPlanWidget.vue`
  - 内部状态：`visible` / `expanded`
  - 数据：固定数组（7 天 + 活动）
  - 仅 UI，不依赖 API

- Portal 首页集成：`apps/portal/client/src/views/PortalHomeView.vue`
  - 在页面根部加入 `<WeeklyReadingPlanWidget />`

---

## 测试与验证

由于 Portal client 当前没有测试框架（vitest）配置：
- 方案：新增最小 vitest + @vue/test-utils + jsdom，添加 1–2 个组件渲染测试
  - 默认渲染为收起态
  - 点击“展开”后出现 7 行计划内容

构建验证：
- `apps/portal/client npm run build` 必须成功

---

## 非目标（Not in scope）
- 不做 localStorage 记忆
- 不做日历/提醒/推送
- 不动态高亮“今天是周几”（如需后续再加）
