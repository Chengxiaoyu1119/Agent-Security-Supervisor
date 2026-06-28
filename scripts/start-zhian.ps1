$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

$env:PYTHONUTF8 = "1"
$env:AGENT_SUPERVISOR_AUTH_DISABLED = "true"
$env:AGENT_SUPERVISOR_API_HOST = "127.0.0.1"
$env:AGENT_SUPERVISOR_API_PORT = "8012"

Write-Host "Starting Zhian Shao demo environment..."

if (-not (Test-Path "apps\console\dist\index.html")) {
  Write-Host "Console build was not found. Building console first..."
  npm run console:build
}

Start-Job -ScriptBlock {
  Start-Sleep -Seconds 3
  Start-Process "http://127.0.0.1:8012"
} | Out-Null

Write-Host "Browser will open http://127.0.0.1:8012"
Write-Host "Close this window to stop the demo service."
python -X utf8 -m apps.api.dev_server
