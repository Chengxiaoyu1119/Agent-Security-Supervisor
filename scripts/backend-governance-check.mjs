import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiRoot = path.join(root, 'apps', 'api', 'agent_supervisor');

const ignoredDirectories = new Set(['__pycache__']);
const allowedDirectories = new Set(['adapters', 'config', 'domains', 'routers', 'services']);
const allowedRootPythonFiles = new Set([
  '__init__.py',
  'ablation.py',
  'agent_integrations.py',
  'agents.py',
  'anomaly.py',
  'approvals.py',
  'assessment.py',
  'attack_chains.py',
  'attack_lab.py',
  'attack_testsets.py',
  'auth.py',
  'benign.py',
  'benign_cases_data.py',
  'benign_cases_group1.py',
  'benign_cases_group2.py',
  'benign_workflows.py',
  'briefing_export.py',
  'calibration.py',
  'capability_replay.py',
  'cli.py',
  'correlation.py',
  'data.py',
  'database.py',
  'datasets.py',
  'demo_drill.py',
  'event_stream.py',
  'events.py',
  'evidence.py',
  'external_agent_demo.py',
  'gap_rerun.py',
  'integrity.py',
  'main.py',
  'main_models.py',
  'memory_governance.py',
  'model_adapter.py',
  'model_runtime_config.py',
  'openai_proxy.py',
  'openclaw_adapter.py',
  'openclaw_plugin_package.py',
  'openclaw_plugin_templates.py',
  'paths.py',
  'penetration_lab.py',
  'proxy_security.py',
  'readiness.py',
  'readiness_checks.py',
  'redteam_lab.py',
  'risk_score.py',
  'roadmap.py',
  'runtime_evaluation.py',
  'runtime_status.py',
  'supervisor.py',
  'surface_pack.py',
  'surface_pack_html.py',
  'target_lab.py',
  'tools.py'
]);
const requiredModelAdapterModules = new Set(['model_adapter.py']);
const requiredReportModules = new Set([
  'briefing_export.py',
  'readiness.py',
  'readiness_checks.py',
  'roadmap.py',
  'surface_pack.py',
  'surface_pack_html.py'
]);
const allowedDomainDirectories = new Set(['reports']);
const allowedAdapterDirectories = new Set(['models']);

function readMaybe(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function countLines(file) {
  const text = readMaybe(file);
  return text ? text.split(/\r?\n/).length : 0;
}

function listEntries(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

const rootEntries = listEntries(apiRoot);
const unexpectedRootDirectories = rootEntries
  .filter((entry) => entry.isDirectory() && !ignoredDirectories.has(entry.name) && !allowedDirectories.has(entry.name))
  .map((entry) => `apps/api/agent_supervisor/${entry.name}`);
const unexpectedRootPythonFiles = rootEntries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.py') && !allowedRootPythonFiles.has(entry.name))
  .map((entry) => `apps/api/agent_supervisor/${entry.name}`);

const domainsRoot = path.join(apiRoot, 'domains');
const unexpectedDomainDirectories = listEntries(domainsRoot)
  .filter((entry) => entry.isDirectory() && !ignoredDirectories.has(entry.name) && !allowedDomainDirectories.has(entry.name))
  .map((entry) => `apps/api/agent_supervisor/domains/${entry.name}`);
const unexpectedDomainFiles = listEntries(domainsRoot)
  .filter((entry) => entry.isFile() && entry.name !== '__init__.py')
  .map((entry) => `apps/api/agent_supervisor/domains/${entry.name}`);

const adaptersRoot = path.join(apiRoot, 'adapters');
const unexpectedAdapterDirectories = listEntries(adaptersRoot)
  .filter((entry) => entry.isDirectory() && !ignoredDirectories.has(entry.name) && !allowedAdapterDirectories.has(entry.name))
  .map((entry) => `apps/api/agent_supervisor/adapters/${entry.name}`);
const unexpectedAdapterFiles = listEntries(adaptersRoot)
  .filter((entry) => entry.isFile() && entry.name !== '__init__.py')
  .map((entry) => `apps/api/agent_supervisor/adapters/${entry.name}`);

const reportsRoot = path.join(domainsRoot, 'reports');
const missingReportModules = Array.from(requiredReportModules)
  .filter((name) => !fs.existsSync(path.join(reportsRoot, name)))
  .map((name) => `apps/api/agent_supervisor/domains/reports/${name}`);

const modelsRoot = path.join(adaptersRoot, 'models');
const missingModelAdapterModules = Array.from(requiredModelAdapterModules)
  .filter((name) => !fs.existsSync(path.join(modelsRoot, name)))
  .map((name) => `apps/api/agent_supervisor/adapters/models/${name}`);

const reportCompatibilityWrappers = Array.from(requiredReportModules).map((name) => {
  const rootFile = path.join(apiRoot, name);
  const text = readMaybe(rootFile);
  const moduleName = name.replace(/\.py$/, '');
  const expectedImport = `from .domains.reports.${moduleName} import *`;
  return {
    file: relative(rootFile),
    lines: countLines(rootFile),
    has_expected_import: text.includes(expectedImport),
    is_compatibility_wrapper: text.includes('Compatibility wrapper') && text.includes(expectedImport)
  };
});
const modelCompatibilityWrappers = Array.from(requiredModelAdapterModules).map((name) => {
  const rootFile = path.join(apiRoot, name);
  const text = readMaybe(rootFile);
  const moduleName = name.replace(/\.py$/, '');
  const expectedImport = `from .adapters.models.${moduleName} import *`;
  return {
    file: relative(rootFile),
    lines: countLines(rootFile),
    has_expected_import: text.includes(expectedImport),
    is_compatibility_wrapper: text.includes('Compatibility wrapper') && text.includes(expectedImport)
  };
});
const compatibilityWrappers = [...reportCompatibilityWrappers, ...modelCompatibilityWrappers];
const requiredCompatibilityRootModules = new Set([...requiredReportModules, ...requiredModelAdapterModules]);
const invalidCompatibilityWrappers = compatibilityWrappers.filter(
  (item) => !item.is_compatibility_wrapper || item.lines > 6
);

const rootPythonFiles = rootEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.py'));
const rootPythonSummary = rootPythonFiles
  .map((entry) => {
    const fullPath = path.join(apiRoot, entry.name);
    return {
      file: relative(fullPath),
      lines: countLines(fullPath),
      compatibility_wrapper: requiredCompatibilityRootModules.has(entry.name)
    };
  })
  .sort((a, b) => b.lines - a.lines || a.file.localeCompare(b.file));
const oversizedRootFiles = rootPythonSummary.filter((item) => !item.compatibility_wrapper && item.lines > 650);

const budgets = {
  unexpected_root_directory_max: 0,
  unexpected_root_python_file_max: 0,
  unexpected_domain_directory_max: 0,
  unexpected_domain_file_max: 0,
  missing_report_module_max: 0,
  missing_model_adapter_module_max: 0,
  unexpected_adapter_directory_max: 0,
  unexpected_adapter_file_max: 0,
  invalid_compatibility_wrapper_max: 0,
  root_python_file_soft_max_lines: 650
};

const violations = [];
if (unexpectedRootDirectories.length) violations.push(`Unexpected backend root directories: ${unexpectedRootDirectories.join(', ')}`);
if (unexpectedRootPythonFiles.length) violations.push(`Unexpected backend root Python files: ${unexpectedRootPythonFiles.join(', ')}`);
if (unexpectedDomainDirectories.length) violations.push(`Unexpected backend domain directories: ${unexpectedDomainDirectories.join(', ')}`);
if (unexpectedDomainFiles.length) violations.push(`Unexpected files under domains root: ${unexpectedDomainFiles.join(', ')}`);
if (unexpectedAdapterDirectories.length) violations.push(`Unexpected backend adapter directories: ${unexpectedAdapterDirectories.join(', ')}`);
if (unexpectedAdapterFiles.length) violations.push(`Unexpected files under adapters root: ${unexpectedAdapterFiles.join(', ')}`);
if (missingModelAdapterModules.length) violations.push(`Missing model adapter modules: ${missingModelAdapterModules.join(', ')}`);
if (missingReportModules.length) violations.push(`Missing report domain modules: ${missingReportModules.join(', ')}`);
if (invalidCompatibilityWrappers.length) {
  violations.push(
    `Invalid report compatibility wrappers: ${invalidCompatibilityWrappers.map((item) => `${item.file} lines=${item.lines}`).join(', ')}`
  );
}

const warnings = [];
if (oversizedRootFiles.length) {
  warnings.push(
    `Large root modules remain and should be split later: ${oversizedRootFiles.map((item) => `${item.file} ${item.lines} lines`).join(', ')}`
  );
}

const result = {
  checked_at: new Date().toISOString(),
  root_python_file_count: rootPythonFiles.length,
  report_domain_module_count: Array.from(requiredReportModules).filter((name) => fs.existsSync(path.join(reportsRoot, name))).length,
  model_adapter_module_count: Array.from(requiredModelAdapterModules).filter((name) => fs.existsSync(path.join(modelsRoot, name))).length,
  unexpected_root_directories: unexpectedRootDirectories,
  unexpected_root_python_files: unexpectedRootPythonFiles,
  unexpected_domain_directories: unexpectedDomainDirectories,
  unexpected_domain_files: unexpectedDomainFiles,
  unexpected_adapter_directories: unexpectedAdapterDirectories,
  unexpected_adapter_files: unexpectedAdapterFiles,
  missing_model_adapter_modules: missingModelAdapterModules,
  missing_report_modules: missingReportModules,
  compatibility_wrappers: compatibilityWrappers,
  invalid_compatibility_wrappers: invalidCompatibilityWrappers,
  oversized_root_files: oversizedRootFiles,
  root_python_summary: rootPythonSummary,
  budgets,
  budget_status: violations.length ? 'failed' : 'passed',
  violations,
  warnings,
  recommendations: [
    'Put new business modules under apps/api/agent_supervisor/domains/<domain> instead of the package root.',
    'Keep FastAPI route registration in routers/ and call domain modules from routers.',
    'Keep moved root modules as short compatibility wrappers until all imports are migrated.',
    'Split remaining large root modules such as cli.py and redteam_lab.py in later low-risk batches.'
  ]
};

console.log(JSON.stringify(result, null, 2));
if (violations.length) process.exit(1);
