Write-Host "Script started at $(Get-Date)"
$services = docker compose -f docker-compose.yml ps
Write-Host "Service check returned: $($services.Count) lines"
Write-Host $services
