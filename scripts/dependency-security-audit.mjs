import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REPORT_DIR = resolve("apps/api/sandbox/reports");
const JSON_REPORT = resolve(REPORT_DIR, "dependency-security-audit.json");
const MARKDOWN_REPORT = resolve(REPORT_DIR, "依赖安全审计报告.md");

const PROJECTS = [
  {
    id: "console",
    name: "React 控制台",
    path: "apps/console",
    accepted: { low: 0, moderate: 0, high: 0, critical: 0 },
    note: "控制台依赖应保持 0 个已知漏洞。",
  },
  {
    id: "www",
    name: "Astro 官网",
    path: "apps/www",
    accepted: { low: 2, moderate: 0, high: 0, critical: 0 },
    note: "当前低危来自 Astro/esbuild 开发服务器链路；生产构建是静态文件，不暴露 dev server。",
  },
  {
    id: "docs",
    name: "Docusaurus 文档站",
    path: "apps/docs",
    accepted: { low: 0, moderate: 26, high: 0, critical: 0 },
    note: "当前中危主要来自 Docusaurus 上游构建链路；已用 override 处理 serialize-javascript 高危，剩余不做强制大版本替换。",
  },
];

function runAudit(project) {
  const npmCli = findNpmCli();
  const result = spawnSync(
    process.execPath,
    [npmCli, "audit", "--json", "--prefix", project.path, "--audit-level=low", "--registry=https://registry.npmjs.org"],
    {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 20,
    },
  );
  const parsed = parseAuditOutput(result.stdout, result.stderr);
  const counts = normalizeCounts(parsed?.metadata?.vulnerabilities);
  const commandError = result.error ? String(result.error) : "";
  const auditOutputValid = Boolean(parsed?.metadata?.vulnerabilities);
  const status = commandError || !auditOutputValid ? "failed" : classifyStatus(counts, project.accepted);
  return {
    id: project.id,
    name: project.name,
    path: project.path,
    status,
    accepted_threshold: project.accepted,
    vulnerability_counts: counts,
    npm_audit_exit_code: result.status,
    command_error: commandError,
    audit_output_valid: auditOutputValid,
    note: project.note,
    advisories: summarizeAdvisories(parsed),
  };
}

function findNpmCli() {
  const candidates = [
    process.env.npm_execpath,
    process.env.APPDATA ? resolve(process.env.APPDATA, "npm/node_modules/npm/bin/npm-cli.js") : "",
    resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
    resolve(dirname(process.execPath), "../node_modules/npm/bin/npm-cli.js"),
  ].filter(Boolean);
  const npmCli = candidates.find((candidate) => existsSync(candidate));
  if (!npmCli) {
    throw new Error("Unable to locate npm-cli.js. Run this command through npm or install npm with Node.js.");
  }
  return npmCli;
}

function parseAuditOutput(stdout, stderr) {
  const text = stdout?.trim() || stderr?.trim() || "";
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return {
      parse_error: "npm audit did not return JSON output",
      raw_output_preview: text.slice(0, 2000),
    };
  }
}

function normalizeCounts(raw = {}) {
  const info = Number(raw.info || 0);
  const low = Number(raw.low || 0);
  const moderate = Number(raw.moderate || 0);
  const high = Number(raw.high || 0);
  const critical = Number(raw.critical || 0);
  const total = Number(raw.total ?? info + low + moderate + high + critical);
  return { info, low, moderate, high, critical, total };
}

function classifyStatus(counts, accepted) {
  if (counts.critical > accepted.critical || counts.high > accepted.high) {
    return "failed";
  }
  if (counts.moderate > accepted.moderate || counts.low > accepted.low) {
    return "failed";
  }
  if (counts.total === 0) {
    return "passed";
  }
  return "accepted-residual";
}

function summarizeAdvisories(parsed) {
  const vulnerabilities = parsed?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== "object") {
    return [];
  }
  return Object.entries(vulnerabilities)
    .slice(0, 20)
    .map(([name, value]) => ({
      package: name,
      severity: value?.severity || "unknown",
      via: Array.isArray(value?.via) ? value.via.map((item) => (typeof item === "string" ? item : item?.title || item?.name || "advisory")) : [],
      fix_available: value?.fixAvailable ?? false,
    }));
}

function buildMarkdown(report) {
  const lines = [
    "# 依赖安全审计报告",
    "",
    `生成时间：${report.generated_at}`,
    `总体状态：\`${report.status}\``,
    "",
    "## 结论",
    "",
    "| 项目 | 状态 | low | moderate | high | critical | 说明 |",
    "|---|---|---:|---:|---:|---:|---|",
  ];
  for (const item of report.projects) {
    const counts = item.vulnerability_counts;
    lines.push(
      `| ${item.name} | \`${item.status}\` | ${counts.low} | ${counts.moderate} | ${counts.high} | ${counts.critical} | ${item.command_error || item.note} |`,
    );
  }
  lines.push(
    "",
    "## 使用方式",
    "",
    "- `npm run audit:security`：生成本报告；高危/严重或超出已接受阈值会失败。",
    "- `npm run audit:raw:console`、`npm run audit:raw:www`、`npm run audit:raw:docs`：查看 npm 原始审计结果。",
    "",
    "## 当前处理原则",
    "",
    "- 不使用 `npm audit fix --force` 强行升大版本，避免把官网或文档站构建链路打断。",
    "- 官网和文档站开发服务器只在本机使用，不对公网暴露。",
    "- 生产交付使用静态构建产物；后续等 Astro、Docusaurus 上游修复后再收敛残留漏洞。",
  );
  return lines.join("\n");
}

mkdirSync(REPORT_DIR, { recursive: true });
const projects = PROJECTS.map(runAudit);
const failed = projects.filter((item) => item.status === "failed");
const report = {
  generated_at: new Date().toISOString(),
  status: failed.length ? "failed" : "passed-with-accepted-residuals",
  failed_project_ids: failed.map((item) => item.id),
  projects,
};

writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(MARKDOWN_REPORT, buildMarkdown(report), "utf8");
console.log(JSON.stringify({ status: report.status, report: JSON_REPORT, failed_project_ids: report.failed_project_ids }, null, 2));

if (failed.length) {
  process.exitCode = 1;
}
