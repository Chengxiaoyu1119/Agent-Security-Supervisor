---
id: api
title: API 地图
---

# API 地图

后端服务位于 `apps/api`，默认端口是 `8012`。

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| 健康检查 | GET | `/api/health` |
| 总览数据 | GET | `/api/overview` |
| 剧本列表 | GET | `/api/scenarios` |
| 运行剧本 | POST | `/api/run` |
| 攻防对比 | POST | `/api/compare` |
| 批量对比 | POST | `/api/batch_compare` |
| 攻击链列表 | GET | `/api/attack_chains` |
| 策略列表 | GET | `/api/policies` |
| 审计日志 | GET | `/api/audit_logs` |
| 告警列表 | GET | `/api/alerts` |
| 评测报告 | GET | `/api/report` |
| 外部事件监督 | POST | `/api/supervisor/evaluate` |
| OpenClaw 事件 | POST | `/api/integrations/openclaw/events` |

## API Token

正式部署默认需要 API Token。`npm run api` 会为本地演示显式设置 `AGENT_SUPERVISOR_AUTH_DISABLED=true`，直接部署后端时不要依赖这个开发开关。

```powershell
$env:AGENT_SUPERVISOR_API_TOKEN="your-token"
```

请求时推荐使用：

```text
Authorization: Bearer your-token
```

控制台可以通过 `apps/console/.env` 注入：

```text
VITE_AGENT_SUPERVISOR_API_TOKEN=your-token
```

也可以在浏览器控制台临时写入：

```js
localStorage.setItem("agent-supervisor-api-token", "your-token")
```
