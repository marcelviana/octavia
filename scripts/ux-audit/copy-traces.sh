#!/usr/bin/env bash
# Copia os traces da última execução da Fase D para docs/ux/fase-d/traces/,
# nomeados pelo diretório de output do teste (mesmo nome que o recorder
# grava no campo `trace` dos JSONs de docs/ux/fase-d/data/).
set -euo pipefail
cd "$(dirname "$0")/../.."

SRC="test-results/ux-audit"
DST="docs/ux/fase-d/traces"
mkdir -p "$DST"

count=0
while IFS= read -r -d '' trace; do
  dir="$(basename "$(dirname "$trace")")"
  cp "$trace" "$DST/$dir.zip"
  count=$((count + 1))
done < <(find "$SRC" -name 'trace.zip' -print0 2>/dev/null)

echo "[copy-traces] $count traces copiados para $DST"
