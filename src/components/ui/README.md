# 基础 UI 组件规范

这个目录只放跨页面复用的基础组件。

## 已有组件

- `UiButton`：统一按钮，不再手写 `primary-button`、`ghost-button`、`mini-action`。
- `MetricCard`：统一指标卡，替代页面内重复的指标块。
- `StatusPill`：统一状态标签，适合允许、拒绝、询问、隔离等状态。
- `DecisionPill`：统一安全决策标签，避免在页面里反复拼 `decision ${value}`。

## 新增规则

- 出现 2 次以上的基础 UI，放到这里。
- 业务强相关组件不放这里，继续留在对应页面附近。
- 组件只暴露必要属性，样式通过 Token 和已有全局类控制。
