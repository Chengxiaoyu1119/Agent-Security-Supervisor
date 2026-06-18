---
id: reports
title: 证据与报告
---

# 证据与报告

智安哨的报告不是静态说明，而是从攻击面、剧本、策略、运行日志和评测结果中生成。

## 主要材料

- 攻击面证据包。
- 攻防有效性评测。
- 正常业务误报评测。
- 策略消融实验。
- 异常检测阈值校准。
- 赛前一键体检报告。
- OpenClaw 插件包验收报告。

## 常用命令

```powershell
npm run cli -- surface-packs --output apps/api/sandbox/reports
npm run cli -- assess --run-compare --output apps/api/sandbox/reports/攻防有效性评测.md
npm run cli -- readiness --write --output apps/api/sandbox/reports
```
