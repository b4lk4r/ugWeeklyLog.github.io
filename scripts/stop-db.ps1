$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
& 'C:/Program Files/pgsql/bin/pg_ctl.exe' -D (Join-Path (Get-Location) '.local/pgdata') stop -m fast
