@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-zhian.ps1"
if errorlevel 1 (
  echo.
  echo Zhian Shao failed to start. Please send the error output above to the developer.
  pause
)
