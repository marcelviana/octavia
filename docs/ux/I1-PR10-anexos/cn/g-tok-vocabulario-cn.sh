#!/usr/bin/env bash
# I1-PR-10, div. 750 — CN do vocabulário do G-tok: o gate (ii) VELHO (o da main 8b662fc) e o NOVO (o desta árvore)
# sobre os 11 arquivos da visualização como estão na main — só a classe "inglês" interessa aqui.
# Uso (da raiz): bash docs/ux/I1-PR10-anexos/cn/g-tok-vocabulario-cn.sh <pasta-temporária>
set -euo pipefail
raiz=$(pwd); S=$1; rm -rf "$S"; mkdir -p "$S/scripts/gates-web"
git show 8b662fc:scripts/gates-web/g-tok.mjs > "$S/scripts/gates-web/g-tok-velho.mjs"
cp scripts/gates-web/g-tok.mjs "$S/scripts/gates-web/g-tok-novo.mjs"
: > "$S/scripts/gates-web/g-tok-sem-ingles.txt"
L=("app/content/[id]/page.tsx" components/content-page-client.tsx components/content-viewer.tsx
  components/content-viewer/ContentHeader.tsx components/content-viewer/ContentDisplay.tsx components/content-viewer/ContentSidebar.tsx
  components/content-viewer/ChordDisplay.tsx components/content-viewer/LyricsDisplay.tsx components/content-viewer/TabDisplay.tsx
  components/content-viewer/SheetMusicDisplay.tsx components/pdf-viewer.tsx)
printf '%s\n' "${L[@]}" > "$S/scripts/gates-web/g-tok-arquivos.txt"
for f in "${L[@]}"; do mkdir -p "$S/$(dirname "$f")"; git show "8b662fc:$f" > "$S/$f"; done
cd "$S"
for g in velho novo; do
  echo "## gate $g — os 11 arquivos da main (8b662fc)"
  node "scripts/gates-web/g-tok-$g.mjs" --so-arquivos > "saida-$g.txt" 2>&1 || true
  grep 'inglês' "saida-$g.txt" | sed -E 's/^ *✗ //' || true
  echo "  → acusações de inglês: $(grep -c 'inglês' "saida-$g.txt" || true) · $(grep -o 'textos examinados: [0-9]*' "saida-$g.txt") · $(grep -o 'vocabulário: [0-9]*' "saida-$g.txt")"
done
