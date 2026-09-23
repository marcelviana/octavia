#!/bin/sh
# W4-b2, H1 (o B8.1): o APK roda quando O PUSH toca o nativo, não quando a PR já
# tocou. O `paths` do `pull_request` é avaliado contra o diff ACUMULADO da PR —
# um push só de docs numa PR que já tocou `apps/native/**` custava um APK
# inteiro (no N2, 7 corridas, 83m32s; `N2-ENCERRAMENTO.md` §7). O `paths` fica
# no `native.yml` como filtro de fora (PR que nunca tocou o nativo nem dispara);
# este script decide, por dentro, se o push DESTE evento mudou o que o APK lê.
#
# O QUE CONTA COMO NATIVO: `apps/native/**` (este script incluído), o
# `pnpm-workspace.yaml` e os DOIS workflows de que o APK e o próprio detector
# dependem — `native.yml` e `gates.yml` (decisão do Marcel, 2026-09-23: mudar o
# instrumento é mudar o que ele mede, e o APK roda). A lista está escrita também
# no `paths` do `native.yml`; mudar uma é mudar as duas.
#
# SÓ FILTRA quando as três coisas valem — em qualquer outro caso, o APK roda:
#
#   1. a ação é `synchronize` (abertura, reopen e push na `main` rodam);
#   2. o `antes` é ancestral do head. **Div. 353 — o padrão seguro**: num push
#      forçado o `antes` sumiu da história que o checkout traz, e comparar
#      árvore contra árvore exigiria buscar um commit órfão que o GitHub pode
#      já não servir. Então roda. Push forçado em PR é contra a regra
#      (`LOGS-OCTAVIA.md`, "Errata W4-b2"); o custo dele, se acontecer, é um APK;
#   3. **div. 360 — o último APK desta PR foi `success`**. Um push só de docs
#      depois de um APK vermelho deixaria o check do head `skipped` e o
#      vermelho sumiria da lista da PR. Se o último não foi verde — `failure`,
#      `cancelled`, ainda correndo, ou nenhum (`inexistente`) —, roda.
#      Uma corrida em que o APK saiu `skipped` conta como `success`: só se
#      pula depois de um verde, então o skipped herda o verde de antes.
#
# O último APK vem do `gh run list` (com o `GITHUB_TOKEN`, `actions: read`), da
# corrida mais nova do `native.yml` nesta branch que não é a corrente; a
# conclusão é a da CORRIDA. `ULTIMO_APK` no ambiente pula a consulta — é por aí
# que o `cn-w4b2.sh` roda os casos sem API. Consulta que falha = `erro` = roda.
#
# Uso (da RAIZ): sh apps/native/scripts/mudou-nativo.sh <ação> <antes> <head>
#   no CI: BRANCH, GITHUB_REPOSITORY, GITHUB_RUN_ID e GH_TOKEN no ambiente
# stdout: `nativo=true|false` (vai para o $GITHUB_OUTPUT); stderr: o porquê.
N=true
if [ "$1" = synchronize ] && git merge-base --is-ancestor "$2" "$3" 2>/dev/null; then
  [ -n "${ULTIMO_APK+x}" ] || ULTIMO_APK=$(gh run list --repo "$GITHUB_REPOSITORY" --workflow native.yml \
    --branch "$BRANCH" --event pull_request --limit 20 --json databaseId,status,conclusion \
    --jq "[.[] | select(.databaseId != ${GITHUB_RUN_ID:-0})][0] | if . == null then \"inexistente\" elif .status != \"completed\" then .status else .conclusion end") \
    || ULTIMO_APK=erro
  if [ "$ULTIMO_APK" != success ]; then
    echo "último APK desta PR: '${ULTIMO_APK:-vazio}', não success (div. 360): roda" >&2
  else
    D=$(git diff --name-only "$2" "$3")
    echo "último APK desta PR: success. Desde o push anterior ($2..$3):" >&2; printf '%s\n' "$D" | sed 's/^/  /' >&2
    printf '%s\n' "$D" | grep -qE '^(apps/native/|\.github/workflows/(native|gates)\.yml$|pnpm-workspace\.yaml$)' || N=false
  fi
else echo "ação '$1' sem push anterior ancestral (div. 353, padrão seguro): roda" >&2; fi
echo "nativo=$N"
