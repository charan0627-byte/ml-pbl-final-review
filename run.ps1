# DRIS One-Command Runner script for Windows PowerShell
param (
    [string]$Command = "dev"
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot

# Set local tools in PATH
$NodePath = "$WorkspaceRoot\tools\node\node-v20.18.0-win-x64"
if (Test-Path $NodePath) {
    $env:PATH = "$NodePath;$env:PATH"
}

$VenvPython = "$WorkspaceRoot\backend\venv\Scripts\python.exe"

switch ($Command) {
    "setup" {
        Write-Host "[DRIS] Setting up environment..." -ForegroundColor Cyan
        
        # 1. Portable Node check/install
        if (-not (Test-Path $NodePath)) {
            Write-Host "[DRIS] Installing portable Node.js..." -ForegroundColor Yellow
            python "$WorkspaceRoot\scripts\install_node.py"
            $env:PATH = "$NodePath;$env:PATH"
        }

        # 2. Virtual environment setup
        if (-not (Test-Path "$WorkspaceRoot\backend\venv")) {
            Write-Host "[DRIS] Creating Python virtual environment..." -ForegroundColor Yellow
            python -m venv "$WorkspaceRoot\backend\venv"
        }

        # 3. Install Backend Dependencies
        Write-Host "[DRIS] Installing Backend Dependencies..." -ForegroundColor Yellow
        & $VenvPython -m pip install -r "$WorkspaceRoot\backend\requirements.txt"

        # 4. Copy .env files if missing
        if (-not (Test-Path "$WorkspaceRoot\backend\.env")) {
            Copy-Item "$WorkspaceRoot\backend\.env.example" "$WorkspaceRoot\backend\.env"
        }
        if (-not (Test-Path "$WorkspaceRoot\frontend\.env")) {
            Copy-Item "$WorkspaceRoot\frontend\.env.example" "$WorkspaceRoot\frontend\.env"
        }

        # 5. Generate GeoJSON dataset
        Write-Host "[DRIS] Seeding Indian District GeoJSON dataset..." -ForegroundColor Yellow
        & $VenvPython "$WorkspaceRoot\scripts\generate_geojson.py"

        # 6. Install Frontend Dependencies
        Write-Host "[DRIS] Installing Frontend Dependencies..." -ForegroundColor Yellow
        Set-Location "$WorkspaceRoot\frontend"
        npm install

        Write-Host "[DRIS] Setup complete successfully!" -ForegroundColor Green
    }

    "dev" {
        Write-Host "[DRIS] Starting DRIS Platform..." -ForegroundColor Cyan
        Write-Host "Backend API:  http://localhost:8000" -ForegroundColor Green
        Write-Host "Swagger Docs: http://localhost:8000/docs" -ForegroundColor Green
        Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Green

        # Start Backend in background process
        $backendProc = Start-Process -FilePath $VenvPython -ArgumentList "-m uvicorn app.main:app --reload --port 8000" -WorkingDirectory "$WorkspaceRoot\backend" -PassThru

        # Start Frontend in background process
        Set-Location "$WorkspaceRoot\frontend"
        $frontendProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -PassThru

        Write-Host "[DRIS] Both Backend (PID $($backendProc.Id)) and Frontend (PID $($frontendProc.Id)) are running." -ForegroundColor Cyan
        Write-Host "Press Ctrl+C or kill processes to stop." -ForegroundColor Gray
    }

    "test" {
        Write-Host "[DRIS] Running system test suite..." -ForegroundColor Cyan
        & $VenvPython -m pytest "$WorkspaceRoot\backend"
    }

    "docker" {
        Write-Host "[DRIS] Building and starting containerized environment with Docker Compose..." -ForegroundColor Cyan
        Set-Location "$WorkspaceRoot"
        docker compose up --build -d
        Write-Host "[DRIS] Docker containers successfully launched!" -ForegroundColor Green
        Write-Host "Frontend Application: http://localhost:80" -ForegroundColor Green
        Write-Host "Backend REST API:     http://localhost:8000" -ForegroundColor Green
        Write-Host "Interactive Docs:     http://localhost:8000/docs" -ForegroundColor Green
    }

    Default {
        Write-Host "Usage: .\run.ps1 [setup|dev|test|docker]" -ForegroundColor Yellow
    }
}
