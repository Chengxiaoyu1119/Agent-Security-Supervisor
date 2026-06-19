---
id: openclaw
title: OpenClaw 接入
---

# OpenClaw 接入

智安哨可以作为外部 Agent 的工具调用安全闸门。

外部系统在工具执行前，把工具名、参数、上下文和运行标识发送给智安哨。智安哨返回允许、拒绝、询问或隔离。

## 兼容事件入口

```text
POST /api/integrations/openclaw/events
```

## 最小外部 Agent 演示

```powershell
node scripts/agent-supervisor-cli.mjs demo-external
```

## 生成插件包

```powershell
node scripts/agent-supervisor-cli.mjs openclaw-plugin --output apps/api/sandbox/reports
```

## 生成插件包验收报告

```powershell
node scripts/agent-supervisor-cli.mjs openclaw-plugin-validate --output apps/api/sandbox/reports
```

如果当前环境安装了 OpenClaw CLI，可以追加 `--inspect-runtime` 做真实 runtime inspect。
