# 智安哨：大模型智能体攻击面研究与行为监督平台

本项目面向“命题挑战赛 | 第十九届全国大学生信息安全竞赛（作品赛）暨第三届‘长城杯’网数智安全大赛（作品赛）”方向一：面向大模型及其应用的安全性研究。

项目主线不是单纯做安全后台，而是做一套可复现、可拦截、可评测的智能体安全研究平台：

```text
红队攻击面研究 -> 攻击样本与脚本复现 -> 智能体靶场验证 -> 行为监督拦截 -> 防御策略评测 -> 告警与报告展示
```

## 核心能力

- 7 类攻击面研究：提示注入、模型越狱、数据泄露、滥用风险、工具调用劫持、记忆中毒、环境感知污染。
- 22 个内置攻击剧本：覆盖文件读写、邮件、API、代码执行、记忆、环境配置，以及队伍账号、赛题附件、提交物、私有榜单、训练平台会话等学生比赛对象。
- 多 Agent 红队链路：规划 Agent、样本生成 Agent、执行 Agent、目标智能体、监督 Agent、评测 Agent。
- 行为监督器：对工具调用输出允许、拒绝、询问、隔离四类决策。
- Web 研究台：攻击面总览、剧本库、复现实验室、链路展示、审计记录、策略中心、告警面板、评测报告。
- 攻击面证据包：每类攻击面可单独汇总样本、越狱用例、脚本、策略命中、工具覆盖、运行证据、缺口提示和导出入口。
- CLI 批量评测：支持命令行批量运行攻击剧本和外部事件日志评估。
- 真实模型接入：支持 DeepSeek、智谱；没有密钥时自动使用本地模拟模型兜底。

## 本地运行

第一次运行需要安装依赖。依赖可以理解为项目运行需要的“工具包”。

```bash
npm install
python -m pip install -r requirements.txt
```

启动后端接口：

```bash
npm run api
```

后端默认地址：

```text
http://127.0.0.1:8012
```

启动前端页面：

```bash
npm run dev
```

打开前端：

```text
http://127.0.0.1:5178
```

## 模型配置

项目不强制要求真实模型密钥。你不填密钥时，系统会使用本地模拟模型，仍然可以完整演示攻击复现、行为监督、告警和报告。

如果要接入真实 DeepSeek 或智谱模型，把 `.env.example` 复制为 `.env`，然后填入对应密钥：

```bash
DEEPSEEK_API_KEY=你的 DeepSeek Key
ZHIPU_API_KEY=你的智谱 Key
```

常用配置项：

```bash
MODEL_REAL_API_ENABLED=true
MODEL_PROVIDER_PRIORITY=deepseek,zhipu
MODEL_TIMEOUT_SECONDS=12
DEEPSEEK_MODEL=deepseek-v4-pro
ZHIPU_MODEL=glm-5.1
```

含义说明：

- `MODEL_REAL_API_ENABLED`：是否允许调用真实模型。
- `MODEL_PROVIDER_PRIORITY`：真实模型优先级，例如先 DeepSeek，失败再智谱。
- `MODEL_TIMEOUT_SECONDS`：接口超时时间，避免演示时一直等待。
- `DEEPSEEK_MODEL`、`ZHIPU_MODEL`：实际调用的模型名称，可按官方控制台可用模型调整。

## CLI 示例

运行单个攻击剧本：

```bash
npm run cli -- run TOOL-HIJACK-001 on
```

批量对比“无防护 / 有防护”：

```bash
python -X utf8 -m backend.zhian.cli assess --run-compare
```

评估外部智能体事件日志：

```bash
python -X utf8 -m backend.zhian.cli evaluate --input backend/sandbox/examples/agent-events-batch.json
```

运行 OpenClaw 兼容批量接入演示：

```bash
npm run cli -- demo-external
```

运行最小外部 Agent 真实工具调度接入演示：

```bash
npm run cli -- external-agent-demo
```

运行策略消融实验：

```bash
npm run cli -- policy-ablation
```

导出单个攻击面证据包：

```bash
npm run cli -- surface-pack --surface prompt-injection --output backend/sandbox/reports
```

一键导出全部攻击面证据包：

```bash
npm run cli -- surface-packs --output backend/sandbox/reports
```

页面一键运行最小外部 Agent 演示：

```text
打开 http://127.0.0.1:5178 或当前 Vite 输出地址，进入“模型与设置”，点击“运行真实 Agent demo”。
```

接口方式运行同一个演示：

```text
POST http://127.0.0.1:8012/api/integrations/openclaw/minimal_agent_demo
```

查看策略消融实验结果：

```text
http://127.0.0.1:8012/api/evaluations/policy_ablation
http://127.0.0.1:8012/api/evaluations/policy_ablation.md
```

查看单个攻击面证据包：

```text
http://127.0.0.1:8012/api/attack_surfaces/evidence_packs
http://127.0.0.1:8012/api/attack_surfaces/evidence_packs.md
http://127.0.0.1:8012/api/attack_surfaces/prompt-injection/evidence_pack
http://127.0.0.1:8012/api/attack_surfaces/prompt-injection/evidence_pack.md
```

生成不混用历史调试记录的干净提交包：

```bash
npm run cli -- clean-package
```

查看 OpenClaw 兼容接入包：

```text
http://127.0.0.1:8012/api/integrations/openclaw/bundle
```

## 安全边界

本项目只攻击本地靶场和假比赛数据，不攻击真实外部系统。

- 邮件工具只写入假 outbox，不发送真实邮件。
- 文件工具只访问沙箱目录，不读取用户真实文件。
- API 工具只访问本地模拟参赛队伍、提交物、复盘记录、成绩榜数据。
- 代码执行工具有命令白名单、路径限制、超时限制。
- 记忆和环境工具只使用演示数据，支持清理和重置。

这些限制的目的是让项目既能真实复现智能体安全风险，又不会对用户电脑或外部系统造成破坏。


