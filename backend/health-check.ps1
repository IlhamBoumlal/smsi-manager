param(
    [string]$ApiBaseUrl = "http://localhost:5006",
    [string]$Email = "superadmin@smsi.local",
    [string]$Password = "ChangeMe@123!",
    [int]$TimeoutSec = 10,
    [switch]$FailOnError,
    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-Result {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [int[]]$ExpectedStatus,
        [object]$Status,
        [bool]$Ok,
        [int]$DurationMs,
        [string]$Details,
        [string]$BodyText
    )

    [pscustomobject]@{
        Name         = $Name
        Method       = $Method
        Path         = $Path
        Expected     = ($ExpectedStatus -join ",")
        Status       = if ($null -ne $Status) { [int]$Status } else { $null }
        Ok           = $Ok
        DurationMs   = $DurationMs
        Details      = $Details
        BodyText     = $BodyText
    }
}

function Invoke-HealthRequest {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Path,
        [int[]]$ExpectedStatus = @(200),
        [hashtable]$Headers = $null,
        [object]$Body = $null
    )

    $uri = if ($Path -match "^https?://") { $Path } else { "$ApiBaseUrl$Path" }
    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        $params = @{
            Uri             = $uri
            Method          = $Method
            TimeoutSec      = $TimeoutSec
            UseBasicParsing = $true
            DisableKeepAlive = $true
        }
        if ($null -ne $Headers) { $params.Headers = $Headers }
        if ($null -ne $Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }

        $res = Invoke-WebRequest @params
        $sw.Stop()
        $status = [int]$res.StatusCode
        $ok = $ExpectedStatus -contains $status
        $detailsMsg = if ($ok) { "OK" } else { "Unexpected status" }

        return New-Result -Name $Name -Method $Method -Path $Path `
            -ExpectedStatus $ExpectedStatus -Status $status -Ok $ok `
            -DurationMs ([int]$sw.ElapsedMilliseconds) -Details $detailsMsg `
            -BodyText ([string]$res.Content)
    }
    catch {
        $sw.Stop()
        $status = $null
        $bodyText = ""
        $details = $_.Exception.Message
        $exception = $_.Exception

        $hasResponse = $exception.PSObject.Properties.Name -contains "Response"
        if ($hasResponse -and $null -ne $exception.Response) {
            try { $status = [int]$exception.Response.StatusCode.value__ } catch {}
            try {
                $reader = New-Object System.IO.StreamReader($exception.Response.GetResponseStream())
                $bodyText = [string]$reader.ReadToEnd()
                if (-not [string]::IsNullOrWhiteSpace($bodyText)) { $details = $bodyText }
            }
            catch {}
        }

        $ok = ($null -ne $status) -and ($ExpectedStatus -contains [int]$status)
        if ($ok) { $details = "OK" }

        return New-Result -Name $Name -Method $Method -Path $Path `
            -ExpectedStatus $ExpectedStatus -Status $status -Ok $ok `
            -DurationMs ([int]$sw.ElapsedMilliseconds) -Details $details -BodyText $bodyText
    }
}

$results = New-Object System.Collections.Generic.List[object]

# 1) API reachable + auth guard alive.
$results.Add((Invoke-HealthRequest -Name "Auth guard (no token)" -Method "GET" -Path "/api/auth/me" -ExpectedStatus @(401)))

# 2) Login.
$login = Invoke-HealthRequest -Name "Auth login" -Method "POST" -Path "/api/auth/login" -ExpectedStatus @(200) -Body @{
    email    = $Email
    password = $Password
}
$results.Add($login)

$token = $null
if ($login.Ok -and -not [string]::IsNullOrWhiteSpace($login.BodyText)) {
    try {
        $loginJson = $login.BodyText | ConvertFrom-Json
        if ($loginJson.PSObject.Properties.Name -contains "token") {
            $token = [string]$loginJson.token
        }
        elseif ($loginJson.PSObject.Properties.Name -contains "Token") {
            $token = [string]$loginJson.Token
        }
    }
    catch {}
}

if ([string]::IsNullOrWhiteSpace($token)) {
    $results.Add((New-Result -Name "Protected endpoints" -Method "-" -Path "-" -ExpectedStatus @(200) `
        -Status $null -Ok $false -DurationMs 0 -Details "Skipped: no auth token from login" -BodyText ""))
}
else {
    $authHeaders = @{ Authorization = "Bearer $token" }

    $checks = @(
        @{ Name = "Dashboard global"; Method = "GET"; Path = "/api/dashboard/global"; Expected = @(200) },
        @{ Name = "Cartographie processus"; Method = "GET"; Path = "/api/cartographie/processus"; Expected = @(200) },
        @{ Name = "Documentation permissions"; Method = "GET"; Path = "/api/documentation/permissions"; Expected = @(200) },
        @{ Name = "Documentation list"; Method = "GET"; Path = "/api/documentation"; Expected = @(200) },
        @{ Name = "Incidents list"; Method = "GET"; Path = "/api/incidents"; Expected = @(200) }
    )

    foreach ($check in $checks) {
        $results.Add((Invoke-HealthRequest -Name $check.Name -Method $check.Method -Path $check.Path -ExpectedStatus $check.Expected -Headers $authHeaders))
    }
}

$rows = $results | Select-Object Name, Method, Path, Expected, Status, Ok, DurationMs, Details
$rows | Format-Table -AutoSize

$total = $results.Count
$okCount = ($results | Where-Object { $_.Ok } | Measure-Object).Count
$koCount = $total - $okCount

Write-Host ""
if ($koCount -eq 0) {
    Write-Host "Health check PASSED ($okCount/$total)." -ForegroundColor Green
}
else {
    Write-Host "Health check FAILED ($koCount failed, $okCount passed, total $total)." -ForegroundColor Red
}

if ($Json) {
    Write-Host ""
    ($results | ConvertTo-Json -Depth 6)
}

if ($FailOnError -and $koCount -gt 0) {
    exit 1
}

exit 0
