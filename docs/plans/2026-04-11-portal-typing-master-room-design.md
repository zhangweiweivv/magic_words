# Portal：首页新增房间入口「Typing Master」Design

## Goal
在“可可魔法屋（Portal）”首页 rooms 区域新增第三个房间入口卡片，指向外部打字练习网站：
- URL: https://mango-smoke-0c143a30f.4.azurestaticapps.net/
- 名称：Typing Master
- 用途：打字练习

## Decisions（已确认）
- 采用 *方案 1*：作为第三张“房间卡片”与现有两张并列（保持一致的视觉/交互）。
- 打开方式：*新开标签页*（`target=_blank`），并添加 `rel="noopener noreferrer"`。

## UI/UX
- 卡片元素：
  - icon：⌨️
  - 标题：Typing Master
  - 副标题：打字练习 · 提升速度与准确率
- 视觉：新增 `.room-card.typing` 配色（与 vocab 蓝 / poetry 红 区分），建议紫色渐变。
- 响应式：沿用现有 flex-wrap 布局，桌面并排 3 张，窄屏自动换行。

## Scope
- 仅 Portal client 首页新增入口，不改 Portal server。
- 不引入新依赖。

## Validation
- `apps/portal/client npm run build` 通过
- `apps/portal/client npm test` 通过（现有组件测试不受影响）
