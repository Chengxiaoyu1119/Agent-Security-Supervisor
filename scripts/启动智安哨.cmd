@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0启动智安哨.ps1"
if errorlevel 1 (
  echo.
  echo 智安哨启动失败，请把上面的错误信息发给开发者排查。
  pause
)
