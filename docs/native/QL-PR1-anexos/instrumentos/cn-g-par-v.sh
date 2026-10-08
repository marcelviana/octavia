#!/bin/sh
# CN do G-par de V pelo texto lógico (QL-PR1; QL-D16; div. 1185) — instrumento DE MÃO: troca, por um instante, o
# corpo do leitor (`apps/native/src/screens/Leitor.tsx`, o `CorpoDoLeitor`) por um que QUEBRA com a leitura de
# laboratório em 26 colunas (`quebra-lab.ts`), e a declaração `O_LEITOR_QUEBRA` do teste; roda o G-par de V e devolve
# os dois arquivos com `git checkout`. O que entra no repositório é a SAÍDA.
#
#   CN-V0  a `main` (o leitor não quebra; O_LEITOR_QUEBRA=false)       → passa, 0 continuações nas duas passadas
#   CN-V1  o leitor quebra (válida), a declaração continua false        → REPROVA: "V quebrou o corpo sem a declaração"
#   CN-V2  o leitor quebra (válida), O_LEITOR_QUEBRA=true               → passa: a quebra vale pelo texto lógico
#   CN-V3  o leitor quebra com uma letra trocada, O_LEITOR_QUEBRA=true  → REPROVA: "V diferente do site"
#   CN-V4  o leitor NÃO quebra, O_LEITOR_QUEBRA=true                    → REPROVA: o leitor não viu as colunas do duplo
#   CN-V5  o leitor quebra também a Tab, O_LEITOR_QUEBRA=true           → REPROVA: "TAB QUEBRADA" (QL-R8)
#
# A quebra de laboratório não quebra a Tab (o `estilo` dela tem a entrelinha da tablatura, 1,45 — `estiloDoLeitor`),
# salvo no CN-V5 (`CN_TAB=1`). As variáveis do laboratório vão por `export`/`unset`: no `sh` do macOS (bash em modo
# POSIX) `VAR=x função` deixa a variável valendo DEPOIS da função — a primeira corrida deste CN vazou o defeito do CN-V3
# para o CN-V5.
#
# Uso (da RAIZ do repositório): sh docs/native/QL-PR1-anexos/instrumentos/cn-g-par-v.sh
RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
L=apps/native/src/screens/Leitor.tsx
T=apps/native/test/g-par-visualizacao.test.tsx
[ -z "$(git status --porcelain -- "$L" "$T")" ] || { echo "cn-g-par-v: $L ou $T tem mudança local — nada feito" >&2; exit 2; }
trap 'git checkout -- "$L" "$T"; rm -f "$SAIDA"' EXIT
FALHOU=0
SAIDA=$(mktemp)
roda() {  # roda <nome> <exit esperado> <texto esperado>
  pnpm exec vitest run "$T" --project native-tela > "$SAIDA" 2>&1; X=$?
  sed 's/\x1b\[[0-9;]*m//g' "$SAIDA" | grep -E '^G-par da visualização|o leitor quebra:|^  (QUEBRA|DIFERENTE|TAB)|AssertionError|Tests ' | sed 's/^/      /'
  E=0; [ "$X" -ne 0 ] && E=1
  if [ "$E" = "$2" ]; then echo "  $1: exit $E ✓"; else echo "  $1: exit $E, esperado $2 ✗"; FALHOU=1; fi
  if sed 's/\x1b\[[0-9;]*m//g' "$SAIDA" | grep -qF -- "$3"; then echo "  $1: \"$3\" ✓"; else echo "  $1: sem \"$3\" ✗"; FALHOU=1; fi
}
quebra() {  # o CorpoDoLeitor passa a desenhar a quebra de laboratório em 26 colunas
  sed -i '' "s|{corpo ?? ''}|{quebraDoCn(corpo ?? '', estilo)}|" "$L"
  cat >> "$L" <<'EOF'
// CN da QL-PR1 (cn-g-par-v.sh): o corpo quebrado pela leitura de laboratório em 26 colunas — some com o git checkout
import { quebrar as quebrarDoCn } from '../../../../docs/native/QL-PR1-anexos/instrumentos/quebra-lab'
function quebraDoCn(t: string, e: TextStyle): string {
  const tab = (e.lineHeight ?? 0) / (e.fontSize ?? 1) < 1.5 && !process.env.CN_TAB
  return t === '' || tab ? t : quebrarDoCn(t, 'Lyrics', 26).map((l) => l.texto).join('\n')
}
EOF
}
declara() { sed -i '' 's/^const O_LEITOR_QUEBRA = false$/const O_LEITOR_QUEBRA = true/' "$T"; }

echo "== CN-V0 a main";                                   roda CN-V0 0 'G-par da visualização: zero diferenças ✓'
quebra
echo "== CN-V1 o leitor quebra, sem a declaração";       roda CN-V1 1 'V quebrou o corpo sem a declaração'
declara
echo "== CN-V2 o leitor quebra, com a declaração";       roda CN-V2 0 'G-par da visualização: zero diferenças ✓'
echo "== CN-V3 a quebra troca uma letra";                export LAB_DEFEITO=letra; roda CN-V3 1 'V diferente do site'; unset LAB_DEFEITO
echo "== CN-V5 o leitor quebra também a Tab";            export CN_TAB=1; roda CN-V5 1 'TAB QUEBRADA'; unset CN_TAB
git checkout -- "$L"
echo "== CN-V4 o leitor não quebra, com a declaração";   roda CN-V4 1 'o leitor não viu as colunas do duplo'
git checkout -- "$L" "$T"
echo "== devolvido: git status -- Leitor.tsx g-par-visualizacao.test.tsx"; git status --short -- "$L" "$T" | sed 's/^/    /'; echo "    (vazio = os dois de volta)"
[ $FALHOU -eq 0 ] && echo "cn-g-par-v: todos os controles como esperado ✓" || { echo "cn-g-par-v: ✗"; exit 1; }
