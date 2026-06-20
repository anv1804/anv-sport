$NodeZipUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
$DestZip = "f:\anv-sport\node.zip"
$ExtractDir = "f:\anv-sport\node-portable"

# Locate the bin folder containing node.exe if it already exists
$NodeBin = Get-ChildItem -Path $ExtractDir -Directory | Select-Object -First 1

if ($NodeBin -and (Test-Path "$($NodeBin.FullName)\node.exe")) {
    Write-Host "Node.js already extracted at: $($NodeBin.FullName)"
    $NodePath = $NodeBin.FullName
} else {
    Write-Host "Downloading Node.js portable..."
    try {
        Invoke-WebRequest -Uri $NodeZipUrl -OutFile $DestZip -ErrorAction Stop
    } catch {
        Write-Host "Download failed: $_"
        exit 1
    }

    Write-Host "Extracting Node.js..."
    try {
        if (Test-Path $ExtractDir) {
            Remove-Item $ExtractDir -Recurse -Force
        }
        Expand-Archive -Path $DestZip -DestinationPath $ExtractDir -Force
    } catch {
        Write-Host "Extraction failed: $_"
        exit 1
    }

    # Clean up zip
    Remove-Item $DestZip -Force

    $NodeBin = Get-ChildItem -Path $ExtractDir -Directory | Select-Object -First 1
    $NodePath = $NodeBin.FullName
}

# Add node path to current session's PATH
$env:PATH = "$NodePath;" + $env:PATH

# Verify installation
Write-Host "Checking node and npm versions..."
node -v
npm -v

# Configure npm registry mirror to avoid network abort/reset errors
Write-Host "Configuring npm registry mirror..."
npm config set registry https://registry.npmmirror.com

# Run npm install
Write-Host "Running npm install..."
npm install

# Run prisma generate
Write-Host "Running prisma generate..."
npx prisma generate

Write-Host "Starting development server..."
npm run dev
