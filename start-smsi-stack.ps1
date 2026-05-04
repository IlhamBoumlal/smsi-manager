param(
    [string]$ApiUrl = "http://localhost:5006",
    [string]$ChatbotUrl = "http://localhost:5055",
    [string]$FrontendUrl = "http://localhost:3000",
    [switch]$SkipInstall,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$psExe = "C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe"

$runtimeDir = Join-Path $root ".runtime"
$pidDir = Join-Path $runtimeDir "pids"
$logDir = Join-Path $runtimeDir "logs"
New-Item -ItemType Directory -Force -Path $runtimeDir, $pidDir, $logDir | Out-Null

function Write-Step {
    param(
        [string]$Message,
        [string]$Color = "Cyan"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Get-PidFilePath {
    param([string]$Name)
    return (Join-Path $pidDir "$Name.pid")
}

function Get-ManagedProcessId {
    param([string]$Name)
    $pidFile = Get-PidFilePath -Name $Name
    if (-not (Test-Path $pidFile)) { return $null }

    $raw = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($raw -match "^\d+$") { return [int]$raw }
    return $null
}

function Test-ProcessAlive {
    param([int]$ProcessId)
    try {
        Get-Process -Id $ProcessId -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Remove-StalePidFile {
    param([string]$Name)
    $pidFile = Get-PidFilePath -Name $Name
    if (-not (Test-Path $pidFile)) { return }

    $managedPid = Get-ManagedProcessId -Name $Name
    if ($null -eq $managedPid) {
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
        return
    }

    if (-not (Test-ProcessAlive -ProcessId $managedPid)) {
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    }
}

function Ensure-NpmDependencies {
    param([string]$WorkingDirectory)

    if ($SkipInstall) { return }

    $nodeModulesPath = Join-Path $WorkingDirectory "node_modules"
    if (Test-Path $nodeModulesPath) { return }

    Write-Step "Installation des dependances npm dans '$WorkingDirectory'..." "Yellow"
    if ($DryRun) {
        Write-Step "[DRY-RUN] npm.cmd install" "DarkYellow"
        return
    }

    Push-Location $WorkingDirectory
    try {
        npm.cmd install | Out-Host
    }
    finally {
        Pop-Location
    }
}

function Start-ManagedProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command
    )

    Remove-StalePidFile -Name $Name
    $existingPid = Get-ManagedProcessId -Name $Name
    if ($null -ne $existingPid -and (Test-ProcessAlive -ProcessId $existingPid)) {
        Write-Step "$Name deja demarre (PID $existingPid)." "Green"
        return [pscustomobject]@{ Name = $Name; Started = $false; Pid = $existingPid }
    }

    $stdout = Join-Path $logDir "$Name.out.log"
    $stderr = Join-Path $logDir "$Name.err.log"
    $pidFile = Get-PidFilePath -Name $Name

    if ($DryRun) {
        Write-Step "[DRY-RUN] $Name -> $Command" "DarkYellow"
        return [pscustomobject]@{ Name = $Name; Started = $false; Pid = $null }
    }

    $proc = Start-Process `
        -FilePath $psExe `
        -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $Command `
        -WorkingDirectory $WorkingDirectory `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr `
        -PassThru

    Set-Content -LiteralPath $pidFile -Value $proc.Id -Encoding ASCII
    Write-Step "$Name demarre (PID $($proc.Id))." "Green"
    return [pscustomobject]@{ Name = $Name; Started = $true; Pid = $proc.Id }
}

function Test-HttpReachable {
    param(
        [string]$Url,
        [int]$TimeoutSec = 2
    )

    try {
        Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSec -UseBasicParsing | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Wait-HttpReachable {
    param(
        [string]$Name,
        [string]$Url,
        [int]$MaxAttempts = 20,
        [int]$DelayMs = 1000
    )

    if ($DryRun) { return $false }

    for ($i = 1; $i -le $MaxAttempts; $i++) {
        if (Test-HttpReachable -Url $Url) {
            Write-Step "$Name est joignable: $Url" "Green"
            return $true
        }
        Start-Sleep -Milliseconds $DelayMs
    }

    Write-Step "$Name n'est pas encore joignable: $Url" "Yellow"
    return $false
}

Write-Step "Demarrage de la stack SMSI locale..." "Cyan"
Write-Step "Racine: $root" "DarkCyan"

$frontendDir = Join-Path $root "frontend"
$chatbotDir = Join-Path $root "backend\chatbot-local"

if (-not (Test-Path (Join-Path $root "backend\backend\backend.csproj"))) {
    throw "Projet API .NET introuvable: backend\backend\backend.csproj"
}
if (-not (Test-Path $frontendDir)) {
    throw "Dossier frontend introuvable: $frontendDir"
}
if (-not (Test-Path $chatbotDir)) {
    throw "Dossier chatbot introuvable: $chatbotDir"
}

Ensure-NpmDependencies -WorkingDirectory $chatbotDir
Ensure-NpmDependencies -WorkingDirectory $frontendDir

$ollamaHealthUrl = "http://127.0.0.1:11434/api/tags"
if (Test-HttpReachable -Url $ollamaHealthUrl) {
    Write-Step "Ollama est deja actif." "Green"
}
else {
    Start-ManagedProcess `
        -Name "ollama" `
        -WorkingDirectory $root `
        -Command "ollama serve" | Out-Null
}

$apiCommand = "`$env:ASPNETCORE_URLS='$ApiUrl'; dotnet run --project 'backend/backend/backend.csproj'"
Start-ManagedProcess `
    -Name "api-dotnet" `
    -WorkingDirectory $root `
    -Command $apiCommand | Out-Null

$chatbotCommand = "node src/index.js"
Start-ManagedProcess `
    -Name "chatbot-express" `
    -WorkingDirectory $chatbotDir `
    -Command $chatbotCommand | Out-Null

$frontendCommand = "`$env:REACT_APP_API_URL='$ApiUrl'; `$env:REACT_APP_CHATBOT_API_URL='$ChatbotUrl'; npm.cmd start"
Start-ManagedProcess `
    -Name "frontend-react" `
    -WorkingDirectory $frontendDir `
    -Command $frontendCommand | Out-Null

Write-Step ""
Write-Step "Verification rapide des endpoints..." "Cyan"
Wait-HttpReachable -Name "Ollama" -Url $ollamaHealthUrl | Out-Null
Wait-HttpReachable -Name "Chatbot" -Url "$ChatbotUrl/health" | Out-Null
Wait-HttpReachable -Name "Frontend" -Url $FrontendUrl | Out-Null

Write-Step ""
Write-Step "Stack lancee." "Green"
Write-Step "API .NET      : $ApiUrl" "White"
Write-Step "Chatbot local : $ChatbotUrl" "White"
Write-Step "Frontend      : $FrontendUrl" "White"
Write-Step "Logs          : $logDir" "White"
Write-Step "PID files     : $pidDir" "White"
Write-Step ""
Write-Step "Commande: .\start-smsi-stack.ps1" "DarkCyan"
