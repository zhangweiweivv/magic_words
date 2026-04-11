# Poetry 家长中心升级（默认规则披露 + 难度级别统一调参 + 单篇 override + 按集难度列表）Design

**Goal**：把家长中心从“手输 articleId 调参”升级为一个可理解、可审计、可干预但不破坏状态机正确性的控制台。

你（主人）明确的约束：
- **单篇文章参数修改（override）优先级永远高于按难度级别统一调参。**
- 功能复杂且涉及艾宾浩斯状态机，**宁愿不要也不要错**；必须有完备测试与严格 code review。

---

## 1. 现状梳理（基线）
### 1.1 难度与默认计划
- 难度 `difficulty` 为 1~4，来源：
  - `charCount` → lengthScore(1~4)
  - `genre` → genreScore(1~4)
  - `difficulty = round((lengthScore + genreScore)/2)`，clamp 到 1~4
- 默认计划由 `recommendSchedule(difficulty)` 决定（每个难度档统一一套）：
  - 1: totalStages=3, intervals=[1,2,5]
  - 2: totalStages=3, intervals=[1,3,7]
  - 3: totalStages=4, intervals=[1,3,7,14]
  - 4: totalStages=5, intervals=[2,4,7,14,21]

### 1.2 单篇调参
- 已有后端：`PUT /api/config/article/:articleId`
  - 内部复用 `applyConfigChange()`：写入新 intervals/totalStages，并按 `lastCompletedAt + intervals[stage]` 重算 `nextDueDate`
  - 已毕业不反毕业；若 `stage >= newTotalStages` 自动毕业

---

## 2. 核心设计：计划来源与优先级（解决“永远高优先级”）
### 2.1 新增字段（state）
在每篇文章 state 增加字段：
- `scheduleSource: 'level_default' | 'override'`

语义：
- `level_default`：该篇文章的计划来自“难度等级默认表”，允许被“按等级统一调参”批量更新。
- `override`：该篇文章被家长单独调参过，**永远不被按等级统一调参覆盖**。

### 2.2 规则
- 单篇调参（现有 API）写入后：
  - 强制把该 state 标记为 `scheduleSource='override'`
- 按等级统一调参（新功能）批量应用时：
  - **只更新 `scheduleSource='level_default'` 的文章**
  - `override` 的文章完全跳过

### 2.3 “恢复默认”能力（主人确认需要）
- 家长中心对单篇文章提供按钮：`恢复为默认`
  - 将该篇 `scheduleSource` 从 `override` → `level_default`
  - 并立即用该篇的 difficulty 等级默认表重算 intervals/totalStages + nextDueDate（仍复用 stateMachine 逻辑）

---

## 3. 难度等级默认表：从硬编码变成可配置（可干预）
### 3.1 存储
在 `STATE_ROOT`（即学习状态目录）新增文件：
- `_difficulty_defaults.json`

格式：
```json
{
  "1": { "totalStages": 3, "intervals": [1,2,5] },
  "2": { "totalStages": 3, "intervals": [1,3,7] },
  "3": { "totalStages": 4, "intervals": [1,3,7,14] },
  "4": { "totalStages": 5, "intervals": [2,4,7,14,21] }
}
```

### 3.2 读取策略（兼容）
- 若 `_difficulty_defaults.json` 不存在/损坏 → 回退使用当前代码里的默认表（保证旧逻辑不崩）

### 3.3 校验规则（必须）
为避免状态机出现“nextDueDate 意外为 null”等怪象：
- `totalStages >= 1`
- `intervals` 为正数数组
- **强制：`intervals.length >= totalStages`**
- （可选）intervals 单调不减（更符合记忆曲线；若不满足给出 400 错误）

---

## 4. 后端 API 设计
### 4.1 只读披露
1) `GET /api/admin/difficulty/rules`
- 返回：
  - lengthScore 分档规则（<=50, <=150, <=300, >300）
  - genreScore 映射表
  - 当前 difficulty 默认表（从 `_difficulty_defaults.json` 读，若无则为 fallback）

2) `GET /api/admin/collections`
- 返回所有 collection 名称（复用 catalog 的 listCollections）

3) `GET /api/admin/collection/:collection/articles`
- 返回该集每篇文章：
  - articleId, title, topic(section)
  - **difficulty 等级** + 解释字段（lengthScore/genreScore/charCount/genre）
  - scheduleSource（若该文章已有 state）
  - 当前生效 intervals/totalStages（若已有 state；否则展示“将使用该 difficulty 的默认表”）

> charCount 获取策略：优先从已存在的 state；若无/为 0，则可选从 Obsidian 正文读取并计数（建议按“原文”非空白字符数）。

### 4.2 写入（干预）
4) `PUT /api/admin/difficulty/:level`
- body：`{ totalStages, intervals, applyToExisting: boolean }`
- 行为：
  - 更新 `_difficulty_defaults.json` 的该 level 参数（校验同上）
  - 若 `applyToExisting=true`：
    - 遍历所有 state：筛选 `difficulty==level && scheduleSource=='level_default' && status!='graduated'?`（是否包含 graduated 见实现 plan，建议包含但保持“不反毕业”）
    - 对每篇复用 `applyConfigChange()` 更新 state（写 events 记录）

5) `PUT /api/admin/article/:articleId/override`
- body：`{ totalStages, intervals }`
- 行为：
  - 复用 `applyConfigChange()` 更新
  - 标记 `scheduleSource='override'`

6) `PUT /api/admin/article/:articleId/reset-to-default`
- 行为：
  - 读取该文章 difficulty 对应的默认表
  - 复用 `applyConfigChange()` 更新
  - 标记 `scheduleSource='level_default'`

---

## 5. 前端（ParentView）信息架构
### 5.1 区块 1：默认规则披露（只读）
- 展示难度计算公式
- 展示 lengthScore 分档表
- 展示 genreScore 映射（诗词/唐宋古文/先秦古文/先秦诸子）
- 展示 difficulty 1~4 的默认 totalStages/intervals

### 5.2 区块 2：按难度等级统一调参（可写）
- 4 行编辑器（难度 1~4）
  - totalStages 数字输入
  - intervals 输入（例如 `1,2,5`）
  - 保存按钮
  - checkbox：`保存后立刻应用到已开始文章（仅默认来源）`
- 强制校验 + 友好错误提示

### 5.3 区块 3：按集查看文章难度 + 单篇调参
- 下拉选择 collection
- 列表：每篇文章显示
  - articleId / title / topic
  - difficulty（并可展开看 lengthScore/genreScore/charCount/genre）
  - scheduleSource（默认/已干预）
  - 当前 intervals/totalStages（若已开始）
  - 按钮：`单篇调整` / `恢复默认`

---

## 6. 正确性与安全策略
### 6.1 状态机正确性原则
- 任何计划变更（按等级/单篇）都必须复用 `applyConfigChange()` 这一条路径，确保：
  - nextDueDate 的计算规则一致
  - 自动毕业/不反毕业语义一致

### 6.2 运维安全（批量应用）
- 批量 applyToExisting 前后：
  - 建议停服务 + 备份 state/events（可回滚）
  - 批量写入采用原子 writeJson（现有 writeJson 已原子覆写）

---

## 7. 测试策略（必须覆盖的行为）
后端单测（node --test）：
- difficulty defaults 读写与校验（intervals.length>=totalStages）
- 批量应用只更新 scheduleSource=level_default，且不覆盖 override
- reset-to-default 将 override 变回 level_default
- applyConfigChange 在不同 stage 下重算 nextDueDate 的一致性
- 已毕业文章不会被“反毕业”

前端单测（vitest）：
- 默认规则渲染
- 按等级保存调用 API + 错误提示
- 单篇 override/恢复默认按钮调用 API

---

## 8. 交付方式
- 一个 PR，分小 commits（后端→测试→前端→测试→文档）
- merge 后上线：pull/build/restart
