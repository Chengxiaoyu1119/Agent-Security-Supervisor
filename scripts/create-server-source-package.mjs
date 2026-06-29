import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
const sha = git(["rev-parse", "--short", "HEAD"]);
const dirtyCheck = spawnSync("git", ["diff-index", "--quiet", "HEAD", "--"], {
  cwd: repoRoot,
  stdio: "ignore",
});

if (dirtyCheck.status !== 0) {
  console.warn("Warning: working tree has uncommitted changes. The package uses committed files from HEAD.");
}

const safeBranch = branch.replace(/[^a-zA-Z0-9._-]/g, "-");
const outputDir = resolve(repoRoot, "部署包");
const outputFile = resolve(outputDir, `agent-security-supervisor-${safeBranch}-${sha}.zip`);

mkdirSync(outputDir, { recursive: true });
execFileSync("git", ["archive", "--format=zip", `--output=${outputFile}`, "HEAD"], {
  cwd: repoRoot,
  stdio: "inherit",
});

const sizeMb = (statSync(outputFile).size / 1024 / 1024).toFixed(2);

console.log(`Created server source package: ${outputFile}`);
console.log(`Size: ${sizeMb} MB`);
console.log("Excluded: .env, node_modules, dist/build, runtime data, logs, caches, local IDE files, and frontend/backend tests.");
