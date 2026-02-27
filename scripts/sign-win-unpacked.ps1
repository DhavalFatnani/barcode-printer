# Sign an existing win-unpacked folder (e.g. one built on Mac and copied to Windows).
# Run on Windows. Create the cert first with create-self-signed-cert.ps1, then run this.
# Usage:
#   .\scripts\sign-win-unpacked.ps1
#   .\scripts\sign-win-unpacked.ps1 -UnpackedDir "C:\path\to\win-unpacked"
#   $env:CSC_KEY_PASSWORD = "YourPassword"; .\scripts\sign-win-unpacked.ps1 -UnpackedDir "C:\path\to\win-unpacked"

param(
    [string]$UnpackedDir = "",
    [string]$PfxPath = "",
    [string]$Password = ""
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

if (-not $UnpackedDir) {
    $UnpackedDir = Join-Path $projectRoot "dist" "win-unpacked"
}
if (-not $PfxPath) {
    $inRoot = Join-Path $projectRoot "win-cert.pfx"
    $inBuild = Join-Path $projectRoot "build" "win-cert.pfx"
    if (Test-Path -LiteralPath $inRoot -PathType Leaf) { $PfxPath = $inRoot }
    elseif (Test-Path -LiteralPath $inBuild -PathType Leaf) { $PfxPath = $inBuild }
    else { $PfxPath = $inRoot }
}

$UnpackedDir = $UnpackedDir.TrimEnd('\', '/')
if (-not (Test-Path -LiteralPath $UnpackedDir -PathType Container)) {
    Write-Host "Error: Unpacked folder not found: $UnpackedDir" -ForegroundColor Red
    Write-Host "Usage: .\scripts\sign-win-unpacked.ps1 [-UnpackedDir <path>] [-PfxPath <path>]" -ForegroundColor Gray
    exit 1
}

if (-not (Test-Path -LiteralPath $PfxPath -PathType Leaf)) {
    Write-Host "Error: Certificate not found: $PfxPath" -ForegroundColor Red
    Write-Host "Create it first: .\scripts\create-self-signed-cert.ps1 (creates win-cert.pfx in project root)" -ForegroundColor Gray
    exit 1
}

if (-not $Password) {
    $Password = $env:CSC_KEY_PASSWORD
}
if (-not $Password) {
    Write-Host "Enter the PFX password (or set CSC_KEY_PASSWORD):" -ForegroundColor Yellow
    $sec = Read-Host -AsSecureString "PFX password"
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

try {
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($PfxPath, $Password)
} catch {
    Write-Host "Error: Could not load certificate (wrong password?)." -ForegroundColor Red
    exit 1
}

$exes = Get-ChildItem -Path $UnpackedDir -Filter "*.exe" -Recurse -File
if ($exes.Count -eq 0) {
    Write-Host "Error: No .exe files found in $UnpackedDir" -ForegroundColor Red
    exit 1
}

Write-Host "Signing $($exes.Count) executable(s) in $UnpackedDir ..." -ForegroundColor Cyan
foreach ($exe in $exes) {
    Write-Host "  $($exe.FullName)" -ForegroundColor Gray
    Set-AuthenticodeSignature -FilePath $exe.FullName -Certificate $cert -HashAlgorithm SHA256 -ErrorAction Stop
}
Write-Host "Done. Install win-cert.pfx as Trusted Root on PCs where you run the app." -ForegroundColor Green
