# ====================================================================
# LandLens Full-Stack Automated Production Deployment (Backend + Frontend)
# ====================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [START] Full-Stack Deployment: LandLens Production" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot
if ($null -eq $WorkspaceRoot -or $WorkspaceRoot -eq "") {
    $WorkspaceRoot = Get-Location
}

# -------------------------------------------------------------
# STEP 1: Deploy Backend (AWS Lambda - LandLensIndiaWebApp)
# -------------------------------------------------------------
Write-Host "`n>>> [STEP 1/2] Deploying Serverless Backend Lambda..." -ForegroundColor Yellow
$BackendScript = Join-Path $WorkspaceRoot "deploy-backend.ps1"
powershell -ExecutionPolicy Bypass -File $BackendScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend deployment failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

# -------------------------------------------------------------
# STEP 2: Deploy Frontend (React Vite + S3 + CloudFront CDN)
# -------------------------------------------------------------
Write-Host "`n>>> [STEP 2/2] Deploying React Frontend to S3 & CloudFront..." -ForegroundColor Yellow
$FrontendScript = Join-Path (Join-Path $WorkspaceRoot "frontend-react") "deploy.ps1"
powershell -ExecutionPolicy Bypass -File $FrontendScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend deployment failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " [SUCCESS] Full-Stack Deployment Completed!" -ForegroundColor Green
Write-Host " Live Web App: https://d2l0wwhwiyg7if.cloudfront.net" -ForegroundColor Cyan
Write-Host " Live API Gateway: https://ite6dpt3o6.execute-api.ap-south-1.amazonaws.com" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
