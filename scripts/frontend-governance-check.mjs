import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const allowedSrcDirectories = new Set(['components', 'design', 'fallback', 'pages', 'test', 'types']);
const allowedSrcFiles = new Set([
  'App.tsx',
  'api.test.ts',
  'api.ts',
  'fallback.ts',
  'main.tsx',
  'styles.css',
  'types.ts',
  'utils.test.ts',
  'utils.ts',
  '\u89c6\u89c9\u7cfb\u7edf.css'
]);
const allowedComponentDirectories = new Set([
  'agent',
  'dashboard',
  'evidence',
  'lab',
  'policy',
  'report',
  'scenarios',
  'settings',
  'surface',
  'ui'
]);
const allowedComponentRootFiles = new Set(['README.md', 'index.ts']);
const allowedDesignFiles = new Set(['README.md', 'tokens.css']);
const allowedDesignDirectories = new Set(['视觉系统']);
const allowedPageExtensions = new Set(['.tsx']);
const scannedExtensions = new Set(['.css', '.ts', '.tsx']);

const colorPattern = /#[0-9a-fA-F]{3,8}|rgba?\(/g;
const cssTokenPattern = /var\(--/g;
const inlineStylePattern = /style=\{\{/g;
const directAntdPrimitivePattern = /<(Button|Card|Tag|Badge|Progress|Alert|Table|Tabs|Select|Input)\b/g;

function countMatches(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

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

function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }
    return [fullPath];
  });
}

function toRelativeSourcePath(fullPath) {
  return path.relative(root, fullPath).replaceAll(path.sep, '/');
}

function listDirectoryEntries(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true });
}

function isUiComponentFile(file) {
  return file.startsWith('src/components/ui/');
}

const srcEntries = fs.existsSync(srcRoot) ? fs.readdirSync(srcRoot, { withFileTypes: true }) : [];
const unexpectedSrcEntries = srcEntries
  .filter((entry) => {
    if (entry.isDirectory()) {
      return !allowedSrcDirectories.has(entry.name);
    }
    return !allowedSrcFiles.has(entry.name);
  })
  .map((entry) => `src/${entry.name}`);

const componentsRoot = path.join(srcRoot, 'components');
const unexpectedComponentEntries = listDirectoryEntries(componentsRoot)
  .filter((entry) => {
    if (entry.isDirectory()) {
      return !allowedComponentDirectories.has(entry.name);
    }
    return !allowedComponentRootFiles.has(entry.name);
  })
  .map((entry) => `src/components/${entry.name}`);

const pagesRoot = path.join(srcRoot, 'pages');
const unexpectedPageEntries = listDirectoryEntries(pagesRoot)
  .filter((entry) => entry.isDirectory() || !allowedPageExtensions.has(path.extname(entry.name)))
  .map((entry) => `src/pages/${entry.name}`);

const designRoot = path.join(srcRoot, 'design');
const unexpectedDesignEntries = listDirectoryEntries(designRoot)
  .filter((entry) => {
    if (entry.isDirectory()) {
      return !allowedDesignDirectories.has(entry.name);
    }
    return !allowedDesignFiles.has(entry.name);
  })
  .map((entry) => `src/design/${entry.name}`);

const files = walkFiles(srcRoot)
  .filter((file) => scannedExtensions.has(path.extname(file)))
  .map(toRelativeSourcePath)
  .sort();

const summary = files.map((file) => {
  const text = readMaybe(file);
  const directAntdPrimitiveCount = countMatches(text, directAntdPrimitivePattern);
  return {
    file,
    lines: text ? text.split(/\r?\n/).length : 0,
    bytes: Buffer.byteLength(text),
    hardcoded_color_count: countMatches(text, colorPattern),
    token_usage_count: countMatches(text, cssTokenPattern),
    inline_style_count: countMatches(text, inlineStylePattern),
    direct_antd_primitive_count: directAntdPrimitiveCount,
    direct_antd_primitive_outside_ui_count: isUiComponentFile(file) ? 0 : directAntdPrimitiveCount
  };
});

const appText = readMaybe('src/App.tsx');
const componentMatches = appText.match(/^function [A-Z][A-Za-z0-9_]+/gm) ?? [];
const maxFile = summary.reduce((largest, item) => (item.bytes > largest.bytes ? item : largest), summary[0]);
const directDecisionMarkupCount = countMatches(appText, /className=\{`decision \$\{/g);
const cssHardcodedColorCount = summary
  .filter((item) => item.file.endsWith('.css'))
  .reduce((sum, item) => sum + item.hardcoded_color_count, 0);
const sourceHardcodedColorCount = summary.reduce((sum, item) => sum + item.hardcoded_color_count, 0);
const sourceTokenUsageCount = summary.reduce((sum, item) => sum + item.token_usage_count, 0);
const inlineStyleCount = summary.reduce((sum, item) => sum + item.inline_style_count, 0);
const directAntdPrimitiveCount = summary.reduce((sum, item) => sum + item.direct_antd_primitive_count, 0);
const directAntdPrimitiveOutsideUiCount = summary.reduce(
  (sum, item) => sum + item.direct_antd_primitive_outside_ui_count,
  0
);
const antdPrimitiveWrapperCount = directAntdPrimitiveCount - directAntdPrimitiveOutsideUiCount;
const tokenInfo = fileInfo('src/design/tokens.css');

const uiComponentDir = path.join(root, 'src', 'components', 'ui');
const uiComponentCount = fs.existsSync(uiComponentDir)
  ? fs.readdirSync(uiComponentDir).filter((name) => name.endsWith('.tsx')).length
  : 0;

const budgets = {
  app_max_lines: 1000,
  css_hardcoded_color_max: 25,
  source_hardcoded_color_max: 80,
  inline_style_max: 760,
  ui_component_min: 4,
  token_file_min_bytes: 300,
  direct_antd_primitive_outside_ui_max: 330,
  direct_decision_markup_max: 0,
  unexpected_src_entry_max: 0,
  unexpected_component_entry_max: 0,
  unexpected_page_entry_max: 0,
  unexpected_design_entry_max: 0
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
if (sourceHardcodedColorCount > budgets.source_hardcoded_color_max) {
  violations.push(
    `Source hardcoded color budget exceeded: ${sourceHardcodedColorCount}/${budgets.source_hardcoded_color_max}`
  );
}
if (inlineStyleCount > budgets.inline_style_max) {
  violations.push(`Inline style budget exceeded: ${inlineStyleCount}/${budgets.inline_style_max}`);
}
if (tokenInfo.bytes < budgets.token_file_min_bytes) {
  violations.push(`Design token file too small: ${tokenInfo.bytes}/${budgets.token_file_min_bytes} bytes`);
}
if (directAntdPrimitiveOutsideUiCount > budgets.direct_antd_primitive_outside_ui_max) {
  violations.push(
    `Direct Ant Design primitive usage outside ui budget exceeded: ${directAntdPrimitiveOutsideUiCount}/${budgets.direct_antd_primitive_outside_ui_max}`
  );
}
if (directDecisionMarkupCount > budgets.direct_decision_markup_max) {
  violations.push(
    `Direct decision class markup remains: ${directDecisionMarkupCount}/${budgets.direct_decision_markup_max}`
  );
}
if (unexpectedSrcEntries.length > budgets.unexpected_src_entry_max) {
  violations.push(`Unexpected src entries: ${unexpectedSrcEntries.join(', ')}`);
}
if (unexpectedComponentEntries.length > budgets.unexpected_component_entry_max) {
  violations.push(`Unexpected component entries: ${unexpectedComponentEntries.join(', ')}`);
}
if (unexpectedPageEntries.length > budgets.unexpected_page_entry_max) {
  violations.push(`Unexpected page entries: ${unexpectedPageEntries.join(', ')}`);
}
if (unexpectedDesignEntries.length > budgets.unexpected_design_entry_max) {
  violations.push(`Unexpected design entries: ${unexpectedDesignEntries.join(', ')}`);
}

const warnings = [];
if (inlineStyleCount > 0) {
  warnings.push(`Inline styles remain: ${inlineStyleCount}. Avoid increasing this count without a clear reason.`);
}
if (directAntdPrimitiveOutsideUiCount > 0) {
  warnings.push(
    `Direct Ant Design primitive usage outside src/components/ui remains: ${directAntdPrimitiveOutsideUiCount}. Prefer src/components/ui for repeated basic UI patterns.`
  );
}

const result = {
  checked_at: new Date().toISOString(),
  summary,
  app_component_count: componentMatches.length,
  ui_component_count: uiComponentCount,
  direct_decision_markup_count: directDecisionMarkupCount,
  css_hardcoded_color_count: cssHardcodedColorCount,
  source_hardcoded_color_count: sourceHardcodedColorCount,
  source_token_usage_count: sourceTokenUsageCount,
  inline_style_count: inlineStyleCount,
  direct_antd_primitive_count: directAntdPrimitiveCount,
  direct_antd_primitive_outside_ui_count: directAntdPrimitiveOutsideUiCount,
  antd_primitive_wrapper_count: antdPrimitiveWrapperCount,
  unexpected_src_entries: unexpectedSrcEntries,
  unexpected_component_entries: unexpectedComponentEntries,
  unexpected_page_entries: unexpectedPageEntries,
  unexpected_design_entries: unexpectedDesignEntries,
  largest_file: maxFile,
  budgets,
  structure_rules: {
    src_directories: Array.from(allowedSrcDirectories).sort(),
    component_directories: Array.from(allowedComponentDirectories).sort(),
    page_file_extensions: Array.from(allowedPageExtensions).sort(),
    design_files: Array.from(allowedDesignFiles).sort(),
    design_directories: Array.from(allowedDesignDirectories).sort(),
    antd_wrapper_directory: 'src/components/ui'
  },
  budget_status: violations.length ? 'failed' : 'passed',
  violations,
  warnings,
  recommendations: [
    'Move repeated visual blocks into src/components/ui.',
    'Use Ant Design primitives directly inside src/components/ui only when creating reusable wrappers.',
    'Keep new colors in src/design/tokens.css and consume semantic variables.',
    'Keep src top-level entries within the documented pages/components/design structure.',
    'Split App.tsx by page only after shared UI components are stable.',
    'Avoid adding new page-level CSS files unless they map to a clear feature boundary.'
  ]
};

console.log(JSON.stringify(result, null, 2));
if (violations.length) {
  process.exit(1);
}
