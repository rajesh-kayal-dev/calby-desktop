[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$audioPath = (Resolve-Path "d:\electron.js\calby\assets\sounds\notifications\mixkit-bell-notification-933.wav").Path
$audioUri = [System.Uri]::new($audioPath).AbsoluteUri

$xmlText = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>Reminder</text>
            <text>Test Toast with sound from Calby</text>
        </binding>
    </visual>
    <audio src="$audioUri" />
</toast>
"@

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($xmlText)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe").Show($toast)
Write-Output "Toast shown via PowerShell!"
