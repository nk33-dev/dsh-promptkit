param(
    [string]$Executable = $env:HARNESS_EXE
)
$ErrorActionPreference = 'Stop'
if (-not $Executable) {
    throw 'Set HARNESS_EXE or pass -Executable with the DeepSeek Harness executable path.'
}
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    node --input-type=module -e "import{connect}from'./scripts/cdp.mjs';try{const p=await connect();await p.call('Browser.close').catch(()=>{});p.close();}catch{}"
    $deadline = (Get-Date).AddSeconds(15)
    while ((Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 200 }
    if (Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue) { throw 'Harness did not exit normally' }
    Start-Process -FilePath $Executable -ArgumentList '--remote-debugging-port=19473','--remote-debugging-address=127.0.0.1' -WindowStyle Hidden | Out-Null
    $readyDeadline = (Get-Date).AddSeconds(20)
    do {
        try { $null = Invoke-RestMethod -Uri 'http://127.0.0.1:19473/json/version' -TimeoutSec 1; break }
        catch { if ((Get-Date) -ge $readyDeadline) { throw }; Start-Sleep -Milliseconds 200 }
    } while ($true)
} finally { Pop-Location }
