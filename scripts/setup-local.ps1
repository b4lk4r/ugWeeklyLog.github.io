$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$pgBin='C:\Program Files\pgsql\bin'
$localRoot=Join-Path (Get-Location) '.local'
$dataRoot=Join-Path $localRoot 'pgdata'
if(Test-Path -LiteralPath '.env'){throw '.env уже существует. Для запуска используйте scripts/start.ps1'}
if(Get-NetTCPConnection -State Listen -LocalPort 55432 -ErrorAction SilentlyContinue){throw 'Порт 55432 занят'}
New-Item -ItemType Directory -Path $localRoot -Force | Out-Null
function New-Secret { $bytes=New-Object byte[] 32; $rng=[Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); $rng.Dispose(); return ([BitConverter]::ToString($bytes)).Replace('-','') }
$ownerPass=New-Secret
$appPass=New-Secret
$pwFile=Join-Path $localRoot 'init-password'
[IO.File]::WriteAllText($pwFile,$ownerPass)
try {
 & "$pgBin\initdb.exe" -D $dataRoot -U zra_local --pwfile=$pwFile --auth=scram-sha-256 --encoding=UTF8 --locale=C
 if($LASTEXITCODE -ne 0){throw 'initdb завершился с ошибкой'}
 Add-Content -LiteralPath (Join-Path $dataRoot 'postgresql.conf') -Value "`nlisten_addresses='127.0.0.1'`nport=55432`ntimezone='Europe/Moscow'"
 & "$pgBin\pg_ctl.exe" -D $dataRoot -l (Join-Path $localRoot 'postgres.log') start
 if($LASTEXITCODE -ne 0){throw 'Не удалось запустить PostgreSQL'}
 $env:PGPASSWORD=$ownerPass
 "CREATE ROLE zra LOGIN PASSWORD '$appPass'; CREATE DATABASE zra OWNER zra; CREATE DATABASE zra_test OWNER zra; CREATE DATABASE zra_restore OWNER zra;" | & "$pgBin\psql.exe" -h 127.0.0.1 -p 55432 -U zra_local -d postgres -v ON_ERROR_STOP=1
 if($LASTEXITCODE -ne 0){throw 'Не удалось создать базы'}
 $config="DATABASE_URL=postgresql://zra:$appPass@127.0.0.1:55432/zra`nTEST_DATABASE_URL=postgresql://zra:$appPass@127.0.0.1:55432/zra_test`nRESTORE_DATABASE_URL=postgresql://zra:$appPass@127.0.0.1:55432/zra_restore`nPORT=4180`nHOST=127.0.0.1`nPUBLIC_ORIGIN=http://127.0.0.1:4180`nCOOKIE_SECURE=false`nWEEKEND_POLICY=previous`nPG_BIN=C:/Program Files/pgsql/bin`n"
 [IO.File]::WriteAllText((Join-Path (Get-Location) '.env'),$config)
 [IO.File]::WriteAllText((Join-Path $localRoot 'owner-password'),$ownerPass)
} finally {Remove-Item -LiteralPath $pwFile -Force -ErrorAction SilentlyContinue;Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue}
npm.cmd run migrate
Write-Host 'Отдельная база создана. Создайте администратора: npm.cmd run admin'
