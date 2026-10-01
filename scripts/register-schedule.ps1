$ErrorActionPreference = 'Stop'

$workspace = Split-Path -Parent $PSScriptRoot
$taskName = 'Naukri Profile Update'
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$arguments = "/c `"$npm`" run update-profiles"

$action = New-ScheduledTaskAction `
    -Execute $env:ComSpec `
    -Argument $arguments `
    -WorkingDirectory $workspace
$trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At '08:00AM' `
    -RepetitionInterval (New-TimeSpan -Minutes 30) `
    -RepetitionDuration (New-TimeSpan -Hours 14)
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description 'Runs the Naukri profile update for both configured accounts every 30 minutes from 08:00 to 22:00.' `
    -Force | Out-Null

Write-Output "Scheduled '$taskName' for every 30 minutes from 08:00 through 22:00."