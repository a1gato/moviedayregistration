$f = 'c:\Users\user\Desktop\Registration\style.css'
$c = [System.IO.File]::ReadAllText($f)
$c = $c.Replace('rgba(124,58,237', 'rgba(234,88,12')
$c = $c.Replace('rgba(168,85,247', 'rgba(251,146,60')
[System.IO.File]::WriteAllText($f, $c)
Write-Host "Done! Purple replaced with orange."
