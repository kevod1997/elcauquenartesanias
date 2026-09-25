# Corre las fases del PRD sin supervisión (6.4 de prompts.md): por fase, 6.1 y después 6.2, cada uno
# en una sesión `claude -p` nueva con el bloque de 6.4 agregado. Los prompts se leen de prompts.md.
# Uso: powershell -File scripts/loop-fases.ps1 [-Desde 4] [-Hasta 9]
param([int]$Desde = 4, [int]$Hasta = 9)
$ErrorActionPreference = 'Stop'

# PowerShell 5.1 pasa stdin a los ejecutables en ASCII: sin esto se pierden tildes y emojis.
$OutputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = $OutputEncoding

$raiz = Split-Path $PSScriptRoot -Parent
Set-Location $raiz
$prompts = 'docs/frontend-por-fases/prompts.md'
$readme = 'docs/frontend-por-fases/fases/README.md'
$logs = Join-Path $raiz 'logs/loop'
# El modelo sale de la configuración de Claude Code; el esfuerzo se fija por prompt.
$esfuerzo = @{ '6.1' = 'medium'; '6.2' = 'medium' }

function Get-Bloque([string]$seccion) {
  $texto = Get-Content $prompts -Raw -Encoding UTF8
  $patron = '(?s)## ' + [regex]::Escape($seccion) + ' .*?```text\r?\n(.*?)```'
  $m = [regex]::Match($texto, $patron)
  if (-not $m.Success) { throw "No encontré el bloque de $seccion en $prompts." }
  $m.Groups[1].Value
}

# Una fase preparada ya tiene su primera decisión (FN-D1) en fases/fase-N.md.
function Test-Preparada([int]$n) {
  $definicion = "docs/frontend-por-fases/fases/fase-$n.md"
  (Test-Path $definicion) -and (Select-String -Path $definicion -Pattern "F$n-D1\." -Quiet)
}

function Get-Estado([int]$n) {
  $fila = Get-Content $readme -Encoding UTF8 | Where-Object { $_ -match "^\| $n\. " }
  if (-not $fila) { throw "No encontré la fase $n en la tabla de $readme." }
  $fila
}

function Test-ArbolLimpio { -not (git status --porcelain) }

# Chequeos previos
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { throw 'No encuentro `claude` en el PATH.' }
if (-not (Test-ArbolLimpio)) { throw 'El working tree tiene cambios: commitealos o descartalos antes del loop.' }
if (-not (Test-Path '.env.test.local')) { throw 'Falta .env.test.local con el owner de prueba (ver AGENTS.md).' }
try { Invoke-WebRequest 'http://localhost:3001/api/categorias' -UseBasicParsing -TimeoutSec 5 | Out-Null }
catch { throw 'El backend local no responde en :3001. Corré `pnpm dev` en ../elcauquen-backend.' }

New-Item -ItemType Directory -Force $logs | Out-Null
$modoLoop = Get-Bloque '6.4'

# Que Windows no se suspenda mientras corre el loop; al salir, aunque falle, vuelve a lo normal.
Add-Type -Namespace Win32 -Name Energia -MemberDefinition @'
[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);
'@
$ES_CONTINUOUS = [uint32]'0x80000000'
$ES_SYSTEM_REQUIRED = [uint32]1
[Win32.Energia]::SetThreadExecutionState($ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED) | Out-Null

try {
  foreach ($n in $Desde..$Hasta) {
    if ((Get-Estado $n) -match 'Implementada|Cerrada') { Write-Host "Fase $n ya implementada: la salteo."; continue }

    foreach ($p in '6.1', '6.2') {
      if ($p -eq '6.1' -and (Test-Preparada $n)) { Write-Host "Fase $n ya preparada: salteo 6.1."; continue }
      Write-Host "Fase $n, prompt $p..."
      # `N` suelto y el de `FN-D1` (sin límite de palabra entre F y N) pasan a ser la fase.
      $prompt = ((Get-Bloque $p) + "`n" + $modoLoop) -replace '\b(F?)N\b', ('${1}' + $n)
      $log = Join-Path $logs "fase-$n-$p.json"
      $prompt | claude -p --permission-mode auto --effort $esfuerzo[$p] --output-format json | Out-File $log -Encoding utf8
      $resultado = Get-Content $log -Raw -Encoding UTF8 | ConvertFrom-Json
      if ($LASTEXITCODE -ne 0 -or $resultado.is_error) {
        if ($resultado.result -match 'limit') {
          throw "Límite de uso en la fase $n, prompt ${p}: $($resultado.result) Relanzá el loop después; retoma desde acá."
        }
        throw "Falló el prompt $p de la fase ${n}: revisá $log."
      }
      if (-not (Test-ArbolLimpio)) { throw "La fase $n dejó cambios sin commitear tras ${p}: revisá $log." }
    }

    if ((Get-Estado $n) -notmatch 'Implementada|Cerrada') {
      throw "La fase $n no quedó implementada: revisá $logs/fase-$n-6.2.json y 'Decisiones para el usuario'."
    }
  }
} finally {
  [Win32.Energia]::SetThreadExecutionState($ES_CONTINUOUS) | Out-Null
}

Write-Host "Listo. Revisá 'Decisiones para el usuario' y 'Verificaciones del usuario' en $readme."
