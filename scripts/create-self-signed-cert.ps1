# Create a self-signed code signing certificate and export to PFX for signing BarcodePrinter on Windows.
# Run this once on a Windows machine (PowerShell). You will be prompted for a PFX password.
# Then set CSC_KEY_PASSWORD to that password and run: npm run build:win
# To avoid Smart App Control blocking the app on a PC, install this cert into Trusted Root (see INSTALL.md).

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pfxPath = Join-Path $projectRoot "win-cert.pfx"

Write-Host "Creating self-signed code signing certificate..." -ForegroundColor Cyan
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=BarcodePrinter" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -HashAlgorithm SHA256 `
    -NotAfter (Get-Date).AddYears(3)

Write-Host "Certificate thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
Write-Host ""
Write-Host "Enter a password to protect the exported PFX file (remember it for CSC_KEY_PASSWORD):" -ForegroundColor Yellow
$pwd = Read-Host -AsSecureString "PFX password"

Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd | Out-Null
Write-Host ""
Write-Host "Certificate exported to: $pfxPath" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Set the password when building: set CSC_KEY_PASSWORD=YourPassword" -ForegroundColor White
Write-Host "  2. Run: npm run build:win (or use sign-win-unpacked.ps1 to sign an existing folder)" -ForegroundColor White
Write-Host "  3. On each PC where you run the app, install win-cert.pfx as Trusted Root (see INSTALL.md)" -ForegroundColor White
