@echo off
set "WORKSPACE_ROOT=%~dp0"
set "NODE_PATH=%WORKSPACE_ROOT%tools\node\node-v20.18.0-win-x64"
if exist "%NODE_PATH%" (
    set "PATH=%NODE_PATH%;%PATH%"
)

powershell -ExecutionPolicy Bypass -File "%WORKSPACE_ROOT%run.ps1" %*
