---
id: api
title: API 地图
---

# API 地图

后端服务位于 `apps/api`，默认监听 `127.0.0.1:8012`。本地控制台通过 Vite 代理访问 `/api`。

## 基础接口

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| 健康检查 | GET | `/api/health` |
| 鉴权上下文 | GET | `/api/auth/context` |
| 总览数据 | GET | `/api/overview` |
| 模型状态 | GET | `/api/models` |
| 运行指标 | GET | `/api/observability/metrics` |

## 脚本与运行

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| 脚本列表 | GET | `/api/scenarios` |
| 运行脚本 | POST | `/api/run` |
| 攻防对比 | POST | `/api/compare` |
| 批量对比 | POST | `/api/batch_compare` |
| 攻击链列表 | GET | `/api/attack_chains` |
| 运行攻击链 | POST | `/api/attack_chains/{chain_id}/run` |
| 对比攻击链 | POST | `/api/attack_chains/{chain_id}/compare` |
| 审计 hash 验证 | GET | `/api/runs/{run_id}/audit_hash/verify` |

## 策略、审计和告警

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| 策略列表 | GET | `/api/policies` |
| 更新策略 | PATCH | `/api/policies/{policy_id}` |
| 策略配置 | GET | `/api/policy_config` |
| 更新策略设置 | PATCH | `/api/policy_settings` |
| 策略版本 | GET | `/api/policies/versions` |
| 审计日志 | GET | `/api/audit_logs` |
| 告警列表 | GET | `/api/alerts` |
| 运行事件流 | GET | `/api/events/stream` |
| 记忆治理快照 | GET | `/api/memory_governance` |

## 评测和报告

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| 综合报告 | GET | `/api/report` |
| 攻击样本数据集 | GET | `/api/datasets/attack_cases` |
| 正常样本数据集 | GET | `/api/datasets/benign_cases` |
| 攻击面证据包索引 | GET | `/api/attack_surfaces/evidence_packs` |
| 单攻击面证据包 | GET | `/api/attack_surfaces/{surface_id}/evidence_pack` |
| 攻防有效性 | GET | `/api/evaluations/attack_effectiveness` |
| 正常业务误报 | GET | `/api/evaluations/benign` |
| 连续业务流程误报 | GET | `/api/evaluations/benign_workflows` |
| 策略消融 | GET | `/api/evaluations/policy_ablation` |
| 异常阈值校准 | GET | `/api/evaluations/anomaly_calibration` |
| 赛前体检 | GET | `/api/readiness` |

## 外部 Agent 接入

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| 单事件监督 | POST | `/api/supervisor/evaluate` |
| 批量事件监督 | POST | `/api/supervisor/batch_evaluate` |
| 通用 Agent 接入包 | GET | `/api/integrations/agents/bundle` |
| OpenClaw schema | GET | `/api/integrations/openclaw/schema` |
| OpenClaw 事件 | POST | `/api/integrations/openclaw/events` |
| OpenClaw 接入包 | GET | `/api/integrations/openclaw/bundle` |
| OpenClaw 插件包 | GET | `/api/integrations/openclaw/plugin_package` |
| OpenClaw 插件验证 | GET | `/api/integrations/openclaw/plugin_package/validation` |

## API 鉴权

API 鉴权用于保护后端接口，防止别人直接调用运行脚本、修改策略或生成报告。它和大模型接口是两件事：关闭 API 鉴权不会关闭 DeepSeek、智谱等真实模型调用。

关闭 API 鉴权：

```powershell
$env:AGENT_SUPERVISOR_AUTH_DISABLED="true"
```

开启 API 鉴权时，设置后端 token：


```powershell
$env:AGENT_SUPERVISOR_AUTH_DISABLED="false"
$env:AGENT_SUPERVISOR_API_TOKEN="your-token"
```

请求时推荐使用：

```text
Authorization: Bearer your-token
```

也支持：

```text
X-Agent-Supervisor-Api-Token: your-token
```

控制台可以通过 `apps/console/.env` 注入：

```text
VITE_AGENT_SUPERVISOR_API_TOKEN=your-token
```

也可以在浏览器控制台临时写入：

```js
localStorage.setItem("agent-supervisor-api-token", "your-token")
```

## 角色

开启 API 鉴权时，API 会根据 token 和角色请求头解析安全角色。关闭 API 鉴权时，后端会按 `admin` 角色处理请求。

| 角色 | 典型权限 |
| --- | --- |
| `observer` | 查看运行数据 |
| `analyst` | 处理复核和记忆治理 |
| `admin` | 修改策略和策略设置 |
