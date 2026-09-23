#!/bin/sh
# W4-b2, H1 (o B8.1): o APK roda quando O PUSH toca o nativo, não quando a PR já
# tocou. O `paths` do `pull_request` é avaliado contra o diff ACUMULADO da PR —
# um push só de docs numa PR que já tocou `apps/native/**` custava um APK
# inteiro (no N2, 7 corridas, 83m32s; `N2-ENCERRAMENTO.md` §7). O `paths` fica
# no `native.yml` como filtro de fora (PR que nunca tocou o nativo nem dispara);
# este script decide, por dentro, se o push DESTE evento mudou o que o APK lê.
#
# Só o `synchronize` com um `antes` que é ancestral do head filtra. Todo o resto
# — `opened`, `reopened`, push forçado (o `antes` sumiu da história), push na
# `main` (sem ação) — roda: na dúvida, o APK roda. A regex é a lista do `paths`
# do `native.yml`, escrita de novo; mudar uma é mudar as duas.
#
# Uso (da RAIZ): sh apps/native/scripts/mudou-nativo.sh <ação> <antes> <head>
# stdout: `nativo=true|false` (vai para o $GITHUB_OUTPUT); stderr: o porquê.
N=true
if [ "$1" = synchronize ] && git merge-base --is-ancestor "$2" "$3" 2>/dev/null; then
  D=$(git diff --name-only "$2" "$3")
  echo "desde o push anterior ($2..$3):" >&2; printf '%s\n' "$D" | sed 's/^/  /' >&2
  printf '%s\n' "$D" | grep -qE '^(apps/native/|\.github/workflows/native\.yml$|pnpm-workspace\.yaml$)' || N=false
else echo "ação '$1' sem push anterior ancestral: roda" >&2; fi
echo "nativo=$N"
