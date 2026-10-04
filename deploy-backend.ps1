# ====================================================================
# LandLens Backend Deployment Script (AWS Lambda - NodeJS 20.x)
# ====================================================================

$ErrorActionPreference = "Stop"

Write-Host "[START] Packaging and Deploying LandLens Backend Lambda..." -ForegroundColor Cyan

# 1. Ensure working directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 2. Package Lambda Archive
Write-Host "[ZIP] Creating deployment package from lambda_code/..." -ForegroundColor Yellow
$ZipPath = Join-Path $ScriptDir "lambda_update.zip"

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Set-Location (Join-Path $ScriptDir "lambda_code")
Compress-Archive -Path "index.js", "package.json", "node_modules" -DestinationPath $ZipPath -Force
Set-Location $ScriptDir

Write-Host "[OK] Archive created at $ZipPath" -ForegroundColor Green

# 3. AWS Credentials Check (Uses existing AWS environment variables or AWS CLI profile)
if (-not $env:AWS_ACCESS_KEY_ID) {
    # Set default region
    $env:AWS_DEFAULT_REGION = "ap-south-1"
}

# 4. Upload to AWS Lambda
Write-Host "[AWS] Updating Lambda function 'LandLensIndiaWebApp'..." -ForegroundColor Yellow
$res = aws lambda update-function-code --function-name "LandLensIndiaWebApp" --zip-file "fileb://$ZipPath"

Write-Host "[DONE] LandLens Backend Lambda Updated Successfully!" -ForegroundColor Green
Write-Host "[API]  Base Gateway: https://ite6dpt3o6.execute-api.ap-south-1.amazonaws.com" -ForegroundColor Cyan
