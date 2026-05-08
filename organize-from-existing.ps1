$ErrorActionPreference = 'Stop'

$source = 'C:\Users\admin\Documents\Codex\2026-05-01\i-want-to-create-a-graveyard'
$target = Split-Path -Parent $MyInvocation.MyCommand.Path

$folders = @(
  'data',
  'data\archive',
  'leaflet-prototype',
  'db'
)

foreach ($folder in $folders) {
  New-Item -ItemType Directory -Force -Path (Join-Path $target $folder) | Out-Null
}

$rootFiles = @(
  'index.html',
  'styles.css',
  'script.js',
  'local-server.js',
  'PROJECT_STRUCTURE.md'
)

$dataFiles = @(
  'cemeteries.json',
  'entrances.json',
  'blocks.json',
  'plots.json',
  'burials.json',
  'routing-graph-draft.json',
  'sligo-town-cemetery-draft.geojson',
  'sligo-town-cemetery-metadata.json',
  'field-survey-checklist.md'
)

$archiveFiles = @(
  'block-a-draft.json',
  'sample-grave-records.json',
  'test-plots.json'
)

$leafletFiles = @(
  'index.html',
  'leaflet-layer.js',
  'README.md'
)

$dbFiles = @(
  'README.md',
  'schema-notes.md',
  '001_initial_schema.sql',
  '002_seed_sligo_town_cemetery.sql'
)

foreach ($file in $rootFiles) {
  Copy-Item -LiteralPath (Join-Path $source $file) -Destination (Join-Path $target $file) -Force
}

foreach ($file in $dataFiles) {
  Copy-Item -LiteralPath (Join-Path $source "data\$file") -Destination (Join-Path $target "data\$file") -Force
}

foreach ($file in $archiveFiles) {
  Copy-Item -LiteralPath (Join-Path $source "data\$file") -Destination (Join-Path $target "data\archive\$file") -Force
}

foreach ($file in $leafletFiles) {
  Copy-Item -LiteralPath (Join-Path $source "leaflet-prototype\$file") -Destination (Join-Path $target "leaflet-prototype\$file") -Force
}

foreach ($file in $dbFiles) {
  Copy-Item -LiteralPath (Join-Path $source "db\$file") -Destination (Join-Path $target "db\$file") -Force
}

Remove-Item -LiteralPath (Join-Path $target '.keep') -Force -ErrorAction SilentlyContinue

Write-Host "GraveGuide project organized at: $target"
