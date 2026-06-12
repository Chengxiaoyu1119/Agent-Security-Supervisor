import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'src/App.tsx',
  'src/styles.css',
  'src/视觉系统.css',
  'src/design/tokens.css'
];

const colorPattern = /#[0-9a-fA-F]{3,8}|rgba?\(/g;
const cssTokenPattern = /var\(--/g;

function readMaybe(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function fileInfo(relativePath) {
  const text = readMaybe(relativePath);
  return {
    lines: text ? text.split(/\r?\n/).length : 0,
    bytes: Buffer.byteLength(text)
  };
}

const summary = files.map((file) => {
  const text = readMaybe(file);
  return {
    file,
    lines: text ? text.split(/\r?\n/).length : 0,
    bytes: Buffer.byteLength(text),
    hardcoded_color_count: (text.match(colorPattern) ?? []).length,
    token_usage_count: (text.match(cssTokenPattern) ?? []).length
  };
});

const appText = readMaybe('src/App.tsx');
const componentMatches = appText.match(/^function [A-Z][A-Za-z0-9_]+/gm) ?? [];
const maxFile = summary.reduce((largest, item) => item.bytes > largest.bytes ? item : largest, summary[0]);
const directDecisionMarkupCount = (appText.match(/className=\{`decision \$\{/g) ?? []).length;
const cssHardcodedColorCount = summary
  .filter((item) => item.file.endsWith('.css'))
  .reduce((sum, item) => sum + item.hardcoded_color_count, 0);

const uiComponentDir = path.join(root, 'src', 'components', 'ui');
const uiComponentCount = fs.existsSync(uiComponentDir)
  ? fs.readdirSync(uiComponentDir).filter((name) => name.endsWith('.tsx')).length
  : 0;

const budgets = {
  app_max_lines: 3300,
  css_hardcoded_color_max: 690,
  ui_component_min: 4,
  direct_decision_markup_max: 0
};

const violations = [];
const appInfo = fileInfo('src/App.tsx');
if (appInfo.lines > budgets.app_max_lines) {
  violations.push(`App.tsx line budget exceeded: ${appInfo.lines}/${budgets.app_max_lines}`);
}
if (cssHardcodedColorCount > budgets.css_hardcoded_color_max) {
  violations.push(`CSS hardcoded color budget exceeded: ${cssHardcodedColorCount}/${budgets.css_hardcoded_color_max}`);
}
if (uiComponentCount < budgets.ui_component_min) {
  violations.push(`UI component minimum not met: ${uiComponentCount}/${budgets.ui_component_min}`);
}
if (directDecisionMarkupCount > budgets.direct_decision_markup_max) {
  violations.push(`Direct decision class markup remains: ${directDecisionMarkupCount}/${budgets.direct_decision_markup_max}`);
}

const result = {
  checked_at: new Date().toISOString(),
  summary,
  app_component_count: componentMatches.length,
  ui_component_count: uiComponentCount,
  direct_decision_markup_count: directDecisionMarkupCount,
  css_hardcoded_color_count: cssHardcodedColorCount,
  largest_file: maxFile,
  budgets,
  budget_status: violations.length ? 'failed' : 'passed',
  violations,
  recommendations: [
    'Move repeated visual blocks into src/components/ui.',
    'Keep new colors in src/design/tokens.css and consume semantic variables.',
    'Split App.tsx by page only after shared UI components are stable.',
    'Avoid adding new page-level CSS files unless they map to a clear feature boundary.'
  ]
};

console.log(JSON.stringify(result, null, 2));
if (violations.length) {
  process.exit(1);
}
