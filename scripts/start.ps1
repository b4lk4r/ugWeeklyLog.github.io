$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$dataRoot=Join-Path (Get-Location) '.local/pgdata'
& 'C:/Program Files/pgsql/bin/pg_ctl.exe' -D $dataRoot status
if($LASTEXITCODE -ne 0){& 'C:/Program Files/pgsql/bin/pg_ctl.exe' -D $dataRoot -l (Join-Path (Get-Location) '.local/postgres.log') start}
if(Get-NetTCPConnection -State Listen -LocalPort 4180 -ErrorAction SilentlyContinue){throw 'Порт 4180 уже занят. Возможно, приложение уже запущено.'}
npm.cmd start
