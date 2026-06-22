import { spawn, spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const wwwRoot = join(repoRoot, 'apps', 'www');
const astroBin = join(wwwRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');
const mode = process.argv[2] ?? 'dev';

const commandMap = {
  dev: [['dev', '--host', '127.0.0.1', '--port', '4321']],
  preview: [['preview', '--host', '127.0.0.1', '--port', '4321']],
  build: [['check'], ['build']]
};

function parseVersion(value) {
  const match = String(value).trim().replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: String(value).trim().replace(/^v/, '')
  };
}

function supportsAstro6(version) {
  if (!version) return false;
  if (version.major > 22) return true;
  if (version.major === 22) return version.minor >= 12;
  if (version.major === 20) return version.minor > 19 || (version.minor === 19 && version.patch >= 1);
  return false;
}

function readNodeVersion(nodePath) {
  const result = spawnSync(nodePath, ['-v'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  return parseVersion(result.stdout);
}

function candidateNodes() {
  const paths = [process.execPath];

  if (process.env.AGENT_SUPERVISOR_NODE) {
    paths.push(process.env.AGENT_SUPERVISOR_NODE);
  }

  if (process.env.USERPROFILE) {
    paths.push(
      join(
        process.env.USERPROFILE,
        '.cache',
        'codex-runtimes',
        'codex-primary-runtime',
        'dependencies',
        'node',
        'bin',
        'node.exe'
      )
    );
  }

  paths.push('C:\\Program Files\\nodejs\\node.exe');
  paths.push('C:\\Program Files (x86)\\nodejs\\node.exe');

  return [...new Set(paths)].filter(Boolean);
}

function chooseNode() {
  for (const nodePath of candidateNodes()) {
    if (!existsSync(nodePath)) continue;
    const version = readNodeVersion(nodePath);
    if (supportsAstro6(version)) {
      return { nodePath, version };
    }
  }
  return null;
}

function runAstro(nodePath, args) {
  const child = spawn(nodePath, [astroBin, ...args], {
    cwd: wwwRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${dirname(nodePath)};${process.env.PATH ?? ''}`
    }
  });

  return new Promise((resolveRun) => {
    child.on('close', (code) => resolveRun(code ?? 1));
  });
}

if (!commandMap[mode]) {
  console.error(`未知官网命令：${mode}`);
  console.error('可用命令：dev、build、preview');
  process.exit(1);
}

if (!existsSync(astroBin)) {
  console.error('没有找到官网依赖。请先运行：npm --prefix apps/www install');
  process.exit(1);
}

const selected = chooseNode();
const currentVersion = parseVersion(process.versions.node);

if (!selected) {
  console.error('');
  console.error('官网使用 Astro 6，需要 Node 20.19.1+ 或 Node 22.12.0+。');
  console.error(`你当前的 Node 是 ${currentVersion?.raw ?? process.versions.node}，版本偏低。`);
  console.error('');
  console.error('推荐处理方式：');
  console.error('1. 升级 Node 到 22.12.0 或更高版本；');
  console.error('2. 或设置 AGENT_SUPERVISOR_NODE 指向一个新版 node.exe。');
  console.error('');
  process.exit(1);
}

if (selected.nodePath !== process.execPath) {
  console.log(`官网启动器：当前 Node ${currentVersion?.raw} 不满足 Astro 6，自动使用 Node ${selected.version.raw}。`);
}

let exitCode = 0;
for (const args of commandMap[mode]) {
  exitCode = await runAstro(selected.nodePath, args);
  if (exitCode !== 0) break;
}

process.exit(exitCode);
