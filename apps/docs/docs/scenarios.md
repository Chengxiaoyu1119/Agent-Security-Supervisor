---
id: scenarios
title: 攻击剧本
---

# 攻击剧本

项目当前维护 22 个攻击剧本。

每个剧本通常包含：

- 所属攻击面。
- 模型对抗样本。
- 越狱测试用例。
- 智能体攻击脚本。
- 预期工具调用。
- 成功标准。
- 对应防御策略。

## 运行单个剧本

```powershell
npm run cli -- run TOOL-HIJACK-001 on
```

## 对比有防护和无防护

```powershell
npm run cli -- compare TOOL-HIJACK-001
```

## 批量评测

```powershell
npm run cli -- batch-compare
```
