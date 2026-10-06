$ErrorActionPreference = 'Stop'

$workspace = Split-Path -Parent $PSScriptRoot
$taskName = 'Naukri Profile Update'
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$arguments = "/c `"$npm`" run update-profiles"

$action = New-ScheduledTaskAction `
    -Execute $env:ComSpec `
    -Argument $arguments `
    -WorkingDirectory $workspace
$trigger = New-ScheduledTaskTrigger -Daily -At '12:00AM'
$repetitionClass = Get-CimClass `
    -Namespace 'root/Microsoft/Windows/TaskScheduler' `
    -ClassName 'MSFT_TaskRepetitionPattern'
$trigger.Repetition = New-CimInstance `
    -CimClass $repetitionClass `
    -ClientOnly `
    -Property @{
        Interval = 'PT30M'
        Duration = 'PT23H30M'
        StopAtDurationEnd = $false
    }
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew
$settings.StartWhenAvailable = $true
$settings.WakeToRun = $true
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
    -Description 'Runs the Naukri profile update for both configured accounts every 30 minutes from 00:00 to 23:30 and requests waking the computer from sleep.' `
    -Force | Out-Null

Write-Output "Scheduled '$taskName' for every 30 minutes from 00:00 through 23:30, with wake and missed-run options enabled."