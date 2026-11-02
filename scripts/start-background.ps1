$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if(Get-NetTCPConnection -State Listen -LocalPort 4180 -ErrorAction SilentlyContinue){throw 'Port 4180 is occupied'}
$serverFile=Join-Path (Get-Location) 'server/index.ts'
$child=Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @('--import','tsx',('"'+$serverFile+'"')) -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput (Join-Path (Get-Location) '.local/app.log') -RedirectStandardError (Join-Path (Get-Location) '.local/app-error.log') -PassThru
Write-Host "App PID: $($child.Id). URL: http://127.0.0.1:4180"
