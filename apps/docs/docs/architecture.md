---
id: architecture
title: 系统架构
---

# 系统架构

项目采用多应用目录管理，每个可单独运行的应用都放在 `apps/` 下。

```text
agent-security-supervisor/
├─ apps/
│  ├─ api/        # FastAPI 后端接口服务
│  ├─ console/    # React 控制台
│  ├─ www/        # Astro 官网
│  └─ docs/       # Docusaurus 文档站
├─ docs/          # 历史开发资料和过程记录
├─ scripts/       # 项目脚本
└─ package.json   # 根目录统一命令入口
```

## 运行链路

```text
外部 Agent 或控制台
        ↓
工具调用事件
        ↓
apps/api/agent_supervisor
        ↓
风险评分 + 策略判定
        ↓
允许 / 拒绝 / 询问 / 隔离
        ↓
审计、告警、报告、证据包
```

## 为什么这样分目录

`apps/api` 是后端接口服务。  
`apps/console` 是项目主控制台。  
`apps/www` 是对外官网介绍页。  
`apps/docs` 是正式文档站。  
根目录 `docs` 保留历史材料，不混入正式文档站。
