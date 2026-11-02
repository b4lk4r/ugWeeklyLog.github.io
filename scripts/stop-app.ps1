$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$projectRoot=(Get-Location).Path
$listeners=Get-NetTCPConnection -State Listen -LocalPort 4180 -ErrorAction SilentlyContinue
foreach($listener in $listeners){
 $processInfo=Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
 if($processInfo.CommandLine -and $processInfo.CommandLine.Contains($projectRoot) -and $processInfo.Name -eq 'node.exe'){
  Stop-Process -Id $listener.OwningProcess
 } else {throw 'Port 4180 belongs to another application. No process was stopped.'}
}
