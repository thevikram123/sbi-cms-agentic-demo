param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [double]$Second = 2.0
)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$player = [System.Windows.Media.MediaPlayer]::new()
$player.ScrubbingEnabled = $true
$player.Open([Uri]::new((Resolve-Path -LiteralPath $InputPath).Path))

$deadline = [DateTime]::UtcNow.AddSeconds(8)
while ($player.NaturalVideoWidth -eq 0 -and [DateTime]::UtcNow -lt $deadline) {
  [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke(
    [Action]{},
    [System.Windows.Threading.DispatcherPriority]::Background
  )
  Start-Sleep -Milliseconds 80
}

if ($player.NaturalVideoWidth -eq 0) {
  $player.Close()
  throw "Unable to decode video: $InputPath"
}

$player.Position = [TimeSpan]::FromSeconds($Second)
$player.Play()
Start-Sleep -Milliseconds 450
$player.Pause()

$width = $player.NaturalVideoWidth
$height = $player.NaturalVideoHeight
$visual = [System.Windows.Media.DrawingVisual]::new()
$drawing = $visual.RenderOpen()
$drawing.DrawVideo($player, [Windows.Rect]::new(0, 0, $width, $height))
$drawing.Close()

$bitmap = [System.Windows.Media.Imaging.RenderTargetBitmap]::new(
  $width, $height, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32
)
$bitmap.Render($visual)
$encoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
$encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
$stream = [System.IO.File]::Open($OutputPath, [System.IO.FileMode]::Create)
$encoder.Save($stream)
$stream.Close()
$player.Close()
