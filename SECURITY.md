# 安全说明

## 项目当前安全口径

本项目把安全检查分成三类：

- 必须通过：控制台依赖 0 漏洞、后端测试和类型检查通过、OpenClaw 插件静态验收通过。
- 可接受残留：官网和文档站的上游构建链路中低风险依赖，已记录来源和限制条件。
- 必须处理：任何 high 或 critical 依赖漏洞、后端鉴权绕过、审计记录缺失、危险工具调用漏拦。

## 依赖安全审计

运行：

```powershell
npm run audit:security
```

该命令会生成：

- `apps/api/sandbox/reports/dependency-security-audit.json`
- `apps/api/sandbox/reports/依赖安全审计报告.md`

如果出现 high/critical 漏洞，或者 low/moderate 数量超过当前记录阈值，命令会失败。

原始 npm 审计命令：

```powershell
npm run audit:raw:console
npm run audit:raw:www
npm run audit:raw:docs
```

## 当前已知残留

- `apps/console`：目标是 0 漏洞。
- `apps/www`：当前允许 2 个 low 级别残留，来源是 Astro/esbuild 开发服务器链路；生产构建为静态文件，不暴露 dev server。
- `apps/docs`：当前允许 26 个 moderate 级别残留，主要来自 Docusaurus 上游构建链路；已通过 override 处理 `serialize-javascript` 高危，剩余不强行大版本替换。

## 处理原则

- 不直接运行 `npm audit fix --force`，因为它可能强制升级大版本并破坏官网或文档站构建。
- 开发服务器只绑定本机使用，不对公网开放。
- 生产交付使用构建后的静态文件。
- 每次新增依赖、升级框架、提交比赛包前，都重新运行 `npm run audit:security`。

## OpenClaw 验收

本机未安装 OpenClaw CLI 时，项目只能完成静态验收，并在报告中保留外部环境缺口。

安装 OpenClaw CLI 后运行：

```powershell
node scripts/agent-supervisor-cli.mjs openclaw-plugin-validate --output apps/api/sandbox/reports --inspect-runtime
```

该命令会生成插件包，并自动执行安装、启用、runtime inspect 三步验收。
