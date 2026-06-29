<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F172A,45:2563EB,100:14B8A6&height=220&section=header&text=ZhiAn%20Sentinel&fontSize=48&fontColor=FFFFFF&animation=fadeIn&fontAlignY=38&desc=Agent%20Security%20Supervisor%20%7C%20Red%20Team%20Lab%20%7C%20Defense%20Evaluation&descAlignY=60&descSize=16" alt="ZhiAn Sentinel banner" />
</p>

<p align="center">
  <img src="apps/console/public/favicon.svg" alt="智安哨 logo" width="92" />
</p>

<h1 align="center">智安哨：大模型智能体攻击面研究与行为监督平台</h1>

<p align="center">
  <strong>面向 LLM Agent 的攻击复现、工具调用监督、证据留痕、策略评测与 OpenClaw 接入原型。</strong>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=22&pause=1000&color=38BDF8&center=true&vCenter=true&width=920&lines=Red-Team+Attack+Surface+Research;Agent+Tool-Call+Supervisor;Reproducible+LLM+Security+Evaluation;OpenClaw-Compatible+Runtime+Hook" alt="typing animation" />
</p>

<p align="center">
  <a href="#快速启动"><img alt="Quick Start" src="https://img.shields.io/badge/Quick%20Start-5%20minutes-14b8a6?style=for-the-badge" /></a>
  <a href="#系统架构"><img alt="Architecture" src="https://img.shields.io/badge/Architecture-React%20%2B%20FastAPI-2563eb?style=for-the-badge" /></a>
  <a href="#安全边界"><img alt="Security" src="https://img.shields.io/badge/Security-Sandboxed%20Lab-ef4444?style=for-the-badge" /></a>
  <a href="#命令中心"><img alt="CLI" src="https://img.shields.io/badge/CLI-Evaluation%20Ops-7c3aed?style=for-the-badge" /></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white" />
  <img alt="Ant Design" src="https://img.shields.io/badge/Ant%20Design-6.4-1677ff?logo=antdesign&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3.x-3776ab?logo=python&logoColor=white" />
</p>

---

## 项目概览

智安哨不是普通后台管理系统，而是一套把“红队研究、攻击复现、工具调用监督、防御评测、证据导出”连成闭环的智能体安全研究平台。

它面向“命题挑战赛 | 第十九届全国大学生信息安全竞赛（作品赛）暨第三届长城杯网数智安全大赛（作品赛）”方向一：面向大模型及其应用的安全性研究。

> [!IMPORTANT]
> 本项目只攻击本地靶场和假比赛数据。它的目标是研究和验证智能体安全防护，不会攻击真实外部系统。

```text
红队攻击面研究 -> 攻击样本与脚本复现 -> 智能体靶场验证
        -> 行为监督拦截 -> 防御策略评测 -> 告警与报告展示
```

<table>
  <tr>
    <td align="center"><strong>7</strong><br />攻击面</td>
    <td align="center"><strong>22</strong><br />攻击脚本</td>
    <td align="center"><strong>13</strong><br />防御策略</td>
    <td align="center"><strong>9</strong><br />研究台页面</td>
    <td align="center"><strong>OpenClaw</strong><br />兼容接入</td>
    <td align="center"><strong>Hash</strong><br />审计链</td>
  </tr>
</table>

## 导航

- [项目概览](#项目概览)
- [核心能力](#核心能力)
- [系统架构](#系统架构)
- [攻击面矩阵](#攻击面矩阵)
- [快速启动](#快速启动)
- [模型配置](#模型配置)
- [命令中心](#命令中心)
- [接口地图](#接口地图)
- [安全边界](#安全边界)
- [项目结构](#项目结构)
- [质量检查](#质量检查)
- [常见问题](#常见问题)

## 核心能力

| 模块 | 能力 | 代码入口 |
|---|---|---|
| 攻击面研究台 | 展示 7 类攻击面、风险等级、样本数量、脚本数量和防御建议 | `apps/console/src/pages/Dashboard.tsx` |
| 攻击脚本库 | 管理提示注入、越狱、数据泄露、工具劫持等脚本 | `apps/console/src/components/scenarios/ScenarioLibrary.tsx` |
| 攻击复现实验室 | 支持单脚本运行、无防护/有防护对比、批量对比 | `apps/console/src/components/lab/ExperimentLab.tsx` |
| 多 Agent 攻击链 | 模拟规划 Agent、执行 Agent、目标智能体、监督 Agent、评测 Agent | `apps/console/src/components/agent/AgentChain.tsx` |
| 行为监督器 | 对工具调用输出允许、拒绝、询问、隔离四类决策 | `apps/api/agent_supervisor/supervisor.py` |
| 审计与告警 | 记录工具参数、策略命中、风险分、异常分、审计 hash | `apps/api/agent_supervisor/integrity.py` |
| 证据包与报告 | 导出攻击面证据包、误报评测、攻防有效性报告、赛前体检 | `apps/api/agent_supervisor/evidence.py` |
| OpenClaw 接入 | 提供事件 schema、hook 示例、native plugin 包和验证报告 | `apps/api/agent_supervisor/openclaw_adapter.py` |

> [!NOTE]
> “监督器”可以理解为智能体的安全检查员。每次智能体想调用文件、邮件、API、代码执行、记忆或环境变量工具时，它先判断这次调用能不能放行。

### Web 控制台

| 页面 | 用途 |
|---|---|
| 攻击面研究台 | 看总体覆盖、模型状态、近期运行和攻击面证据入口 |
| 攻击脚本库 | 浏览并选择内置攻击脚本 |
| 攻击复现实验室 | 实际运行攻击，比较开启防护前后的差异 |
| 多Agent攻击链 | 运行多阶段组合攻击链，观察每一步被如何处理 |
| 行为监督记录 | 查看每一次工具调用的审计证据 |
| 防御策略中心 | 查看并调整策略开关 |
| 告警与阻断 | 查看拒绝、询问、隔离产生的安全告警 |
| 评测报告 | 汇总攻防有效性、误报、策略命中、成熟度路线图 |
| 模型与设置 | 查看真实模型接入状态，运行外部 Agent demo |

## 系统架构

```mermaid
flowchart LR
  User["研究者 / 评委 / 安全同学"] --> UI["React + Ant Design Web 控制台"]
  UI --> API["FastAPI 后端 API"]
  CLI["Python CLI 命令中心"] --> API
  External["外部 Agent / OpenClaw"] --> Gateway["OpenClaw 兼容事件入口"]
  Gateway --> Supervisor["行为监督器"]
  API --> Supervisor
  Supervisor --> Policies["13 条防御策略"]
  Supervisor --> Anomaly["轻量异常检测"]
  Supervisor --> Sandbox["本地沙箱工具层"]
  Sandbox --> Evidence["审计日志 / 告警 / 报告 / 证据包"]
  API --> Evidence
  UI --> Evidence
```

```mermaid
sequenceDiagram
  participant R as 红队脚本
  participant A as 目标智能体
  participant S as 智安哨监督器
  participant T as 沙箱工具
  participant E as 证据中心

  R->>A: 注入对抗提示或攻击链任务
  A->>S: 请求调用工具
  S->>S: 策略匹配 + 风险评分 + 异常检测
  alt 允许
    S->>T: 执行沙箱工具
    T->>E: 写入运行证据
  else 拒绝 / 询问 / 隔离
    S->>E: 写入审计日志和告警
  end
  E->>R: 输出对比结果和评测报告
```

## 攻击面矩阵

| 攻击面 | 风险 | 状态 | 样本 | 脚本 | 典型风险 |
|---|---|---|---:|---:|---|
| 提示注入 | high | 可演示 | 18 | 6 | 让外部内容覆盖系统规则 |
| 模型越狱 | high | 可演示 | 9 | 3 | 诱导模型绕过安全约束 |
| 数据泄露 | critical | 可演示 | 18 | 6 | 读取队伍、赛题、提交物、密钥等敏感数据 |
| 滥用风险 | medium | 可演示 | 13 | 5 | 批量外发、垃圾邮件、未授权导出 |
| 工具调用劫持 | critical | 可演示 | 17 | 6 | 通过工具返回或参数污染劫持执行链 |
| 记忆中毒 | high | 可演示 | 9 | 3 | 写入恶意长期记忆，影响未来决策 |
| 环境感知污染 | medium | 可演示 | 12 | 4 | 伪造环境变量或运行上下文 |

<details>
<summary><strong>内置脚本分布</strong></summary>

| 攻击面编号 | 脚本数 |
|---|---:|
| `tool-hijack` | 4 |
| `prompt-injection` | 3 |
| `data-leakage` | 4 |
| `memory-poison` | 2 |
| `jailbreak` | 3 |
| `abuse-risk` | 3 |
| `environment-pollution` | 3 |

</details>

## 防御策略矩阵

| 策略 ID | 策略名称 | 默认 | 主要动作 |
|---|---|---|---|
| `path-boundary` | 文件沙箱边界 | 开启 | 拒绝越界读写 |
| `dangerous-command` | 危险命令拦截 | 开启 | 拒绝高危命令 |
| `code-sandbox` | 代码执行沙箱 | 开启 | 隔离代码运行 |
| `external-mail` | 邮件外发询问 | 开启 | 人工确认外部邮件 |
| `sensitive-api` | 高敏 API 审计 | 开启 | 拒绝未授权高敏接口 |
| `memory-write` | 记忆写入隔离 | 开启 | 隔离污染型记忆 |
| `memory-read-sensitive` | 敏感记忆读取拦截 | 开启 | 拒绝敏感检索 |
| `jailbreak-filter` | 越狱提示过滤 | 开启 | 拒绝越狱提示 |
| `model-output-filter` | 模型输出过滤 | 开启 | 拒绝高风险输出 |
| `bulk-action-review` | 批量动作复核 | 开启 | 询问批量导出或批量外发 |
| `tool-return-trust` | 工具返回低信任隔离 | 开启 | 隔离不可信工具返回 |
| `environment-trust` | 环境信息低信任隔离 | 开启 | 隔离被污染环境信号 |
| `anomaly-detection` | 轻量异常检测 | 开启 | 按异常分询问或拒绝 |

## 快速启动

依赖可以理解为项目运行需要的“工具包”。第一次运行先安装依赖，之后通常不用重复安装。

### 0. 前置环境

- Node.js 22.0 或更高版本。官网和控制台都使用 Vite + React，Node 22.11.0 可以直接运行。
- Python 3.10 或更高版本。后端 API 和命令行工具依赖 Python。

### 1. 安装依赖

```bash
npm --prefix apps/console install
npm --prefix apps/www install
npm --prefix apps/docs install
python -m pip install -r apps/api/requirements.txt
```

### 2. 启动后端 API

```bash
npm run api
```

后端默认地址：

```text
http://127.0.0.1:8012
```

健康检查：

```text
http://127.0.0.1:8012/api/health
```

### 3. 启动前端页面

```bash
npm run console:dev
```

打开：

```text
http://127.0.0.1:5178
```

> [!TIP]
> 如果后端没启动，前端会使用内置样本兜底展示。要记录真实实验日志，需要同时启动后端。

## 模型配置

项目不强制要求真实模型密钥。不填密钥时，系统会自动使用本地模拟模型，仍然可以完整演示攻击复现、行为监督、告警和报告。

如果要接入真实 DeepSeek 或智谱模型，把 `.env.example` 复制为 `.env`，然后填入对应密钥：

```bash
MODEL_REAL_API_ENABLED=true
MODEL_PROVIDER_PRIORITY=deepseek,zhipu
MODEL_TIMEOUT_SECONDS=12

AGENT_SUPERVISOR_AUTH_DISABLED=true
AGENT_SUPERVISOR_API_TOKEN=

DEEPSEEK_API_KEY=你的 DeepSeek Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-pro

ZHIPU_API_KEY=你的智谱 Key
ZHIPU_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
ZHIPU_MODEL=glm-4.6v-flashx
```

| 配置项 | 含义 | 不配置时 |
|---|---|---|
| `MODEL_REAL_API_ENABLED` | 是否允许调用真实模型 | 使用默认值 `false`，默认走本地模拟 |
| `MODEL_PROVIDER_PRIORITY` | 真实模型优先级 | `deepseek,zhipu` |
| `MODEL_TIMEOUT_SECONDS` | 请求超时时间 | 12 秒 |
| `AGENT_SUPERVISOR_AUTH_DISABLED` | 是否关闭 API 鉴权 | 公网演示可设为 `true`；这只影响后端接口访问校验，不影响大模型调用 |
| `AGENT_SUPERVISOR_API_TOKEN` | API 访问令牌 | 关闭鉴权时可留空；开启鉴权时必须配置 |
| `DEEPSEEK_API_KEY` | DeepSeek 密钥 | 不调用 DeepSeek |
| `ZHIPU_API_KEY` | 智谱密钥 | 不调用智谱 |

## 命令中心

CLI 是命令行工具。它适合批量评测、导出报告、生成提交包。不会影响前端页面，只是在本地运行项目提供的 Python 模块。

| 目标 | 命令 |
|---|---|
| 运行单个攻击脚本 | `node scripts/agent-supervisor-cli.mjs run TOOL-HIJACK-001 on` |
| 批量运行全部脚本对比 | `node scripts/agent-supervisor-cli.mjs batch --guard compare` |
| 导出攻防有效性评测 | `node scripts/agent-supervisor-cli.mjs assess --run-compare` |
| 评估外部智能体事件日志 | `node scripts/agent-supervisor-cli.mjs evaluate --input apps/api/sandbox/examples/agent-events-batch.json` |
| 运行 OpenClaw 兼容批量接入演示 | `node scripts/agent-supervisor-cli.mjs demo-external` |
| 运行最小外部 Agent 工具调度演示 | `node scripts/agent-supervisor-cli.mjs external-agent-demo` |
| 运行策略消融实验 | `node scripts/agent-supervisor-cli.mjs policy-ablation` |
| 导出单个攻击面证据包 | `node scripts/agent-supervisor-cli.mjs surface-pack --surface prompt-injection --output apps/api/sandbox/reports` |
| 一键导出全部攻击面证据包 | `node scripts/agent-supervisor-cli.mjs surface-packs --output apps/api/sandbox/reports` |
| 生成干净提交包 | `node scripts/agent-supervisor-cli.mjs clean-package` |
| 赛前一键体检 | `node scripts/agent-supervisor-cli.mjs readiness --write` |
| OpenClaw 插件包生成 | `node scripts/agent-supervisor-cli.mjs openclaw-plugin` |
| OpenClaw 插件包验证 | `node scripts/agent-supervisor-cli.mjs openclaw-plugin-validate` |

<details>
<summary><strong>评委演示建议流程</strong></summary>

1. 打开 Web 控制台：`http://127.0.0.1:5178`
2. 进入“攻击复现实验室”，选择 `TOOL-HIJACK-001`
3. 点击对比运行，展示无防护和有防护结果差异
4. 进入“行为监督记录”，展示策略命中、风险分、异常分、审计 hash
5. 进入“评测报告”，展示攻击面覆盖、误报率、策略消融和路线图
6. 进入“模型与设置”，运行真实 Agent demo 或查看 OpenClaw 接入包

</details>

## 接口地图

| 分组 | 接口 | 用途 |
|---|---|---|
| 健康检查 | `GET /api/health` | 确认后端是否运行 |
| 总览 | `GET /api/overview` | 首页统计、模型状态、近期日志 |
| 脚本 | `GET /api/scenarios` | 获取攻击脚本列表 |
| 运行 | `POST /api/run` | 运行单个脚本 |
| 对比 | `POST /api/compare` | 对比无防护和有防护结果 |
| 批量 | `POST /api/batch_compare` | 批量对比多个脚本 |
| 攻击链 | `GET /api/attack_chains` | 获取组合攻击链 |
| 攻击链运行 | `POST /api/attack_chains/{chain_id}/run` | 运行指定组合链 |
| 审计 | `GET /api/audit_logs` | 获取工具调用审计记录 |
| 告警 | `GET /api/alerts` | 获取阻断、询问、隔离告警 |
| 策略 | `GET /api/policies` | 获取防御策略 |
| 策略更新 | `PATCH /api/policies/{policy_id}` | 开关某条策略 |
| 报告 | `GET /api/report` | 获取综合评测报告 |
| 证据包 | `GET /api/attack_surfaces/evidence_packs` | 获取攻击面证据包索引 |
| 外部事件 | `POST /api/supervisor/evaluate` | 评估单个外部 Agent 工具事件 |
| 批量外部事件 | `POST /api/supervisor/batch_evaluate` | 批量评估外部 Agent 事件 |
| OpenClaw | `GET /api/integrations/openclaw/bundle` | 获取 OpenClaw 接入包 |
| OpenClaw 事件 | `POST /api/integrations/openclaw/events` | OpenClaw 风格工具调用监督入口 |

## OpenClaw 与外部 Agent

智安哨可以作为外部 Agent 的工具调用防火墙。外部系统把即将执行的工具调用发给智安哨，智安哨返回是否允许、拒绝、询问或隔离。

```mermaid
flowchart TD
  Agent["外部 Agent"] --> Event["标准化工具事件"]
  Event --> API["/api/supervisor/evaluate"]
  API --> Guard["智安哨监督器"]
  Guard --> Decision["允许 / 拒绝 / 询问 / 隔离"]
  Decision --> Audit["审计 hash + 风险证据"]
  Decision --> Agent
```

最小事件示意：

```json
{
  "conversation_id": "demo-conv",
  "agent_id": "external-agent-1",
  "agent_role": "assistant",
  "tool_call": {
    "tool": "file.read",
    "arguments": {
      "path": "confidential/competition-teams.csv"
    },
    "risk_hint": "sensitive_file"
  },
  "guard_enabled": true,
  "execute_in_sandbox": false
}
```

## 证据与报告

项目会把运行结果沉淀成可复查材料，方便比赛答辩、论文式分析或工程复盘。

| 产物 | 内容 |
|---|---|
| 攻击面证据包 | 每类攻击面的样本、脚本、策略命中、工具覆盖、缺口提示 |
| 攻防有效性评测 | 无防护是否复现攻击，有防护是否有效控制 |
| 正常任务误报评测 | 正常比赛任务是否被错误拦截 |
| 连续流程误报评测 | 多步骤正常任务流程是否能顺利完成 |
| 异常检测阈值校准 | 推荐异常分阈值、攻击召回率、正常误报率 |
| 策略消融实验 | 关闭某条策略后风险是否暴露，兜底策略是否生效 |
| 赛前一键体检 | 攻击面、误报、OpenClaw、截图和提交包就绪情况 |
| 干净提交包 | 不混用历史调试记录的交付目录和压缩包 |

## 安全边界

> [!CAUTION]
> 仓库里包含攻击样本、越狱样例和工具滥用场景，但它们只用于本地靶场研究。不要把这些样例用于真实系统攻击。

| 工具类型 | 边界 |
|---|---|
| 邮件工具 | 只写入假 outbox，不发送真实邮件 |
| 文件工具 | 只访问沙箱目录，不读取用户真实文件 |
| API 工具 | 只访问本地模拟参赛队伍、提交物、复盘记录、成绩榜数据 |
| 代码执行工具 | 有命令白名单、路径限制、超时限制 |
| 记忆工具 | 只使用演示数据，支持隔离和重置 |
| 环境工具 | 环境信息只作为低信任上下文，不覆盖安全策略 |

## 项目结构

```text
agent-security-supervisor/
├─ apps/
│  ├─ api/                           # FastAPI、监督器、评测、报告、CLI
│  │  ├─ agent_supervisor/           # 后端 Python 包
│  │  ├─ sandbox/                    # 本地靶场数据、示例事件、报告输出
│  │  └─ tests/                      # 后端单元测试
│  ├─ console/                       # React + Vite 控制台
│  │  └─ src/                        # 页面、组件、类型、样式和请求封装
│  ├─ www/                           # Vite + React 官网介绍页
│  └─ docs/                          # Docusaurus 正式文档站
├─ docs/                             # 历史开发记录、方案和过程材料
├─ scripts/                          # 前端治理检查、自审脚本
├─ package.json                      # 根目录统一命令入口
└─ apps/api/requirements.txt         # Python 后端依赖
```

## 质量检查

| 检查 | 命令 | 说明 |
|---|---|---|
| 控制台构建 | `npm run console:build` | TypeScript 类型检查 + Vite 构建 |
| 前端治理检查 | `npm run ui:audit` | 检查前端结构和治理规则 |
| 项目自审 | `npm run self:review` | 输出项目自审报告到沙箱报告目录 |
| 后端健康 | `GET /api/health` | 确认 FastAPI 服务正常 |
| 攻防评测 | `node scripts/agent-supervisor-cli.mjs assess --run-compare` | 对全部脚本跑攻防对比 |

## 常见问题

<details>
<summary><strong>没有模型 key 能不能演示？</strong></summary>

可以。项目会使用本地模拟模型兜底，仍然能演示攻击复现、监督决策、告警、审计和报告。

</details>

<details>
<summary><strong>前端打开后没有真实运行数据？</strong></summary>

先确认后端是否启动：`npm run api`。后端启动后，运行脚本才会写入真实实验日志。

</details>

<details>
<summary><strong>端口被占用怎么办？</strong></summary>

后端默认 `8012`，前端默认 `5178`。如果端口被占用，可以在 `package.json` 里调整脚本端口，或者先关闭占用端口的旧服务。

</details>

<details>
<summary><strong>为什么 README 里有远程动效图片？</strong></summary>

这是 GitHub README 的展示组件，用于增强项目首页观感。它不会参与项目运行，也不会影响本地代码。

</details>

## 路线图

- 扩展更多真实 Agent 框架适配器。
- 增加更细粒度的数据脱敏和字段级访问控制。
- 增强异常检测阈值的自动校准和可解释性。
- 增加更多正常业务流程样本，继续降低误报。
- 增加端到端截图和答辩演示自动化。

## 许可证

当前仓库未包含 `LICENSE` 文件。公开发布或对外复用前，建议补充开源许可证、比赛提交声明或内部使用说明。

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:14B8A6,50:2563EB,100:0F172A&height=120&section=footer" alt="footer wave" />
</p>
