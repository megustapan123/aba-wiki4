param(
    [switch]$Upload,
    [switch]$UploadIndexedMedia,
    [int]$MaximumPages = 0
)

$ErrorActionPreference = 'Stop'
$api = 'https://animebattlearenaaba.fandom.com/api.php'
$root = Split-Path -Parent $PSScriptRoot
$assetDirectory = Join-Path $root 'assets/media'
$manifestPath = Join-Path $root 'assets/manifest.json'
New-Item -ItemType Directory -Force -Path $assetDirectory | Out-Null
$manifest = @{}
if (Test-Path $manifestPath) {
    $existing = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $existing.psobject.Properties | ForEach-Object { $manifest[$_.Name] = $_.Value }
}

function Upload-Media($path, $key) {
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) { throw 'AWS CLI is required to upload to R2.' }
    aws s3 cp $path "s3://$env:R2_BUCKET/$key" --endpoint-url $env:R2_ENDPOINT --no-progress
    if ($LASTEXITCODE -ne 0) { throw "R2 upload failed for $key" }
}

if ($UploadIndexedMedia) {
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) { throw 'AWS CLI is required to upload to R2.' }
    aws s3 sync $assetDirectory "s3://$env:R2_BUCKET/media" --endpoint-url $env:R2_ENDPOINT --no-progress --size-only
    if ($LASTEXITCODE -ne 0) { throw 'R2 indexed-media repair failed.' }
    Write-Output "Done. Synced indexed media files: $($manifest.Count)"
    return
}

function Get-Hash($value) {
    $sha256 = [Security.Cryptography.SHA256]::Create()
    $hash = -join ($sha256.ComputeHash([Text.Encoding]::UTF8.GetBytes($value)) | ForEach-Object { $_.ToString('x2') })
    $sha256.Dispose()
    return $hash
}

function Add-Media($url) {
    if (-not $url -or $manifest.ContainsKey($url)) { return }
    $extension = if ($url -match '\.(gif|png|jpe?g|webp)(?:[/?]|$)') { ".$($Matches[1].ToLowerInvariant().Replace('jpeg', 'jpg'))" } else { '.bin' }
    $key = "media/$(Get-Hash $url)$extension"
    $destination = Join-Path $root "assets/$key"

    if (-not (Test-Path $destination)) {
        $client = [Net.WebClient]::new()
        $client.Headers.Add('User-Agent', 'Mozilla/5.0')
        $client.DownloadFile($url, $destination)
    }
    if ($Upload) {
        Upload-Media $destination $key
    }
    $manifest[$url] = $key
    Write-Output "Saved $key"
}

$titles = (Invoke-RestMethod -Uri "${api}?action=query&format=json&list=categorymembers&cmtitle=Category%3ACharacters&cmnamespace=0&cmlimit=500").query.categorymembers.title
if ($MaximumPages -gt 0) { $titles = $titles | Select-Object -First $MaximumPages }
Write-Output "Syncing media for $($titles.Count) character pages. Re-run this script to resume."

foreach ($title in $titles) {
    try {
        $article = Invoke-RestMethod -Uri "${api}?action=parse&format=json&page=$([uri]::EscapeDataString($title))&prop=text"
        [regex]::Matches($article.parse.text.'*', 'https://static\.wikia\.nocookie\.net/animebattlearenaaba/[^"''\s<>]+') |
            ForEach-Object { $_.Value -replace '&amp;', '&' } |
            Sort-Object -Unique |
            ForEach-Object { Add-Media $_ }
        foreach ($size in 300, 600, 900) {
            $page = Invoke-RestMethod -Uri "${api}?action=query&format=json&prop=pageimages&pithumbsize=$size&titles=$([uri]::EscapeDataString($title))"
            $page.query.pages.psobject.Properties.Value.thumbnail.source | ForEach-Object { Add-Media $_ }
        }
        $manifest | ConvertTo-Json -Depth 2 | Set-Content -Path $manifestPath -Encoding utf8
        Write-Output "Finished $title"
    } catch {
        Write-Warning "Could not sync ${title}: $($_.Exception.Message)"
    }
}

$manifest | ConvertTo-Json -Depth 2 | Set-Content -Path $manifestPath -Encoding utf8
Write-Output "Done. Indexed media files: $($manifest.Count)"