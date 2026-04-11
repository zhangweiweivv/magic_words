# Poetry 可可进度页（全量文章列表 + 征服统计）Design

**Goal**：增加一个“可可可看”的进度页面，让可可一眼看到：
- 所有文章列表（全量、跨集）
- 每篇来自哪个“集”
- 当前艾宾浩斯状态（未开始/学习中第几轮/已毕业、下次复习日）
- 整体统计：已毕业/正在学习/未开始（征服率）
- 每个集的统计（征服率）

**已确认决策**：
- 展示范围：A（全量，跨集）
- 列表组织：A1（按“集”分组折叠）
- 点击文章行：进入 ArticleView（便于继续学习）
- 强约束：进度页数据必须与“家长中心列表”和“单篇详情页（/api/state/:id）”一致，否则视为重大 bug。

---

## 1) 一致性保证（Hard Requirements）

### 1.1 Single Source of Truth（状态字段单一事实来源）
- 任何页面/接口对文章学习状态的展示，都只以 **state 文件**为准（`STATE_ROOT/{articleId}.json`）。
- `currentStage` 一律通过同一个 helper `withCurrentStage(state)`（= `stage + 1`）生成。
- 未开始定义：**state 文件不存在** ⇒ `status='not_started'`。

### 1.2 共享“文章状态快照”组装逻辑（避免三处漂移）
新增一个 server-side 共享函数（建议放 `apps/poetry/server/services/articleStatusSummary.js`）：
- 输入：catalog 文章元信息 + state（可为空）
- 输出：统一的 article summary（包含 status、currentStage、nextDueDate、scheduleSource 等）

进度页新接口与家长中心 admin 列表均复用此函数。

### 1.3 用测试把一致性钉死
在 server 集成测试中新增断言：同一篇 articleId 在以下 3 处返回的关键字段一致：
- `GET /api/state/:articleId`（详情页）
- `GET /api/admin/collection/:collection/articles`（家长中心）
- `GET /api/progress/overview`（进度页）

一致性字段：
- status
- stage / currentStage
- totalStages
- intervals
- nextDueDate
- scheduleSource（缺省时按 level_default 统一口径）

---

## 2) 前端：ProgressView（可可可看）

### 2.1 路由与入口
- 新路由：`/progress`
- 页面：`src/views/ProgressView.vue`
- HomeView 底部 nav 增加入口：`📚 我的进度`

### 2.2 UI 信息架构（A1）
#### 顶部：整体统计卡片
- 总文章数 total
- 已毕业 graduated
- 学习中 active
- 未开始 not_started
- 征服率 conquerRate = graduated/total

#### 中部：按“集”折叠列表（Accordion）
每个集显示：
- 集名（寅集/卯集…）
- 本集统计：graduated/total（可加 active/not_started）
- 本集征服率

展开后：文章清单（建议排序）
1) active（按 nextDueDate 升序；null 在后）
2) not_started（按 number 升序）
3) graduated（按 number 升序）

#### 行内容
- 标题 title
- 题材 section/topic（可选显示）
- 状态 badge：未开始/学习中/已毕业
- 学习中：显示 `第 {currentStage} 轮 / 共 {totalStages} 轮` + `下次复习: nextDueDate`

点击整行：跳转 `ArticleView`（`/article/:articleId`）。

---

## 3) 后端：单请求聚合接口（方案 2）

### 3.1 新接口
- `GET /api/progress/overview`

### 3.2 返回结构（建议）
```json
{
  "overall": {
    "total": 25,
    "graduated": 3,
    "active": 5,
    "not_started": 17,
    "conquerRate": 0.12
  },
  "collections": [
    {
      "collection": "寅集",
      "stats": { "total": 25, "graduated": 3, "active": 5, "not_started": 17, "conquerRate": 0.12 },
      "articles": [
        {
          "articleId": "寅集-01",
          "number": 1,
          "title": "《论语》八章",
          "section": "先秦诸子",

          "status": "active|graduated|not_started",
          "difficulty": 2,
          "scheduleSource": "level_default|override",

          "stage": 1,
          "currentStage": 2,
          "totalStages": 4,
          "intervals": [1,3,7,14],
          "nextDueDate": "2026-04-12"
        }
      ]
    }
  ]
}
```

### 3.3 数据来源与合并规则
- Collections：`listCollections()`
- Catalog：对每个 collection 调 `parseCollection(collection)` 得到 articles（含 number/title/section/articleId）
- State：`readJson(statePath(articleId), null)`
  - 无 state：status=not_started
  - 有 state：复用 state 原值（status/stage/intervals/nextDueDate/scheduleSource…）
  - scheduleSource 缺省统一为 level_default（与 admin.js 一致）

### 3.4 安全与性能
- 只读接口：不写 state、不写 events
- 不接收 articleId / collection 输入，避免路径穿越
- 复杂度：O(总文章数)；目前规模很小（单集 25 篇级别）

---

## 4) 测试策略（Solid）

### 4.1 Server: node:test
- 新增 `GET /api/progress/overview` 集成测试：
  - overall 统计正确
  - per-collection 统计正确
  - 列表包含 started + not_started

- 新增“一致性”集成测试（重大约束）：
  - 选择一个已开始文章 articleId
  - 比对三处返回字段一致（见 1.3）

### 4.2 Client: vitest
- `ProgressView` 渲染测试：
  - 能渲染 overall 卡片
  - 能渲染 collection accordion 与统计
  - 能渲染文章行状态文案

---

## 5) 交付方式
- 按 superpowers：design -> plan -> TDD -> code review -> PR
- PR 合并后上线：pull/build/restart + health check
