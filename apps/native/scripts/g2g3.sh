#!/bin/sh
# G2 — testIDs: antes ⊆ depois.   G3 — linhas `log(` idênticas por arquivo.
# Uso (da RAIZ do repositório): sh apps/native/scripts/g2g3.sh <ref-antes> <ref-depois-ou-WORKTREE>
#
# Versionado na V1-PR3 (commit 5) a partir do `V1-PR1-anexos/V1-PR1-B-gates.txt`,
# com a correção da divergência 30: o ramo de ref-git varria TODOS os arquivos
# sob apps/native/src (inclusive src/fixtures/aceite.py) e o ramo WORKTREE só
# *.ts/*.tsx — assimetria que dá falso positivo no G3 com o .ts idêntico dos
# dois lados quando um não-ts contém a subcadeia `log(`. Agora os dois ramos
# têm o mesmo recorte: `grep -E '\.tsx?$'` na lista do ref-git.
#
# ---------------------------------------------------------------------------
# W2 — O ESCOPO (div. 123 e 128)
#
# Os dois ramos do `coleta()` varriam `apps/native/src`, e o `App.tsx` mora um
# nível acima. O gate que existe para garantir que nenhuma linha do contrato
# suma em silêncio NÃO LIA o arquivo onde vivem TRÊS delas — `login-screen`
# (que prova o A5), `auth uid=… src=…` (A1 e A5) e `download-error` (A13 e
# W1-A4). Medido: o G3 comparava 54 linhas `log(` e a população certa é 57.
#
# O escopo passa a ser `apps/native` INTEIRO, menos duas exclusões declaradas:
#   • `apps/native/test/`     — os testes; já é exclusão declarada, escrita no
#     `vitest.config.mts` ("um teste dentro de src/ falsearia o G2 e o G3");
#   • `apps/native/scripts/`  — os próprios instrumentos, inclusive o `__cn__`.
# `node_modules` sai por construção.
#
# O controle negativo que prova a diferença: apagar `log('login-screen')` do
# `App.tsx` e rodar os dois escopos. Com o de antes, "nenhuma linha sumiu ✓";
# com este, a linha aparece em SUMIRAM e o gate reprova.
# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
# W3 — O G2 DEIXA DE LER COMENTÁRIO. O G3, NÃO — E ISSO É DE PROPÓSITO.
#
# **G2 (div. 136 e 140).** O coletor grepava `testID="…"` no texto CRU, e uma
# MENÇÃO em comentário entrava na população como se fosse prop. A W3 mediu que o
# falso positivo não é inerte (div. 140): com a menção na BASE, editar o
# comentário a faz SUMIR e o G2 reprova por "testID SUMIU" sem que uma linha de
# código mude. O G2 passa a ler o texto SEM COMENTÁRIO (`sem-comentario.awk`).
#
# **G3 — div. 83, a razão por extenso.** (Decisão do Marcel, V1-PR6, 2026-09-13;
# o `V1-ENCERRAMENTO.md` §11 dizia que esta razão estava escrita AQUI, e ela
# nunca esteve, em nenhuma das quatro versões deste arquivo — div. 142. Agora
# está. O original mora em `V1-PR6-anexos/README.md`, "Div. 83, por extenso".)
#
#   O G3 conta `log(` escrito em comentário, e ISSO ESTÁ CERTO. Os dois gates
#   do conjunto medem coisas de natureza oposta, e o erro de cada um não custa
#   a mesma coisa:
#
#     gate:a20  gate de CONTEÚDO — "não há literal de UI em inglês". Acusação
#               falsa gasta a paciência que mantém o gate ligado. Precisa de
#               PRECISÃO, e por isso tira comentário.
#     G3        gate de INVARIÂNCIA — "nenhuma linha de log mudou". Ele não
#               aponta defeito, afirma que nada mudou. Errar para o lado de
#               FALAR DEMAIS custa uma errata a mais; errar para o lado de
#               CALAR deixa uma linha de log sumir em silêncio — e os aceites
#               desta série são lidos PELO LOGCAT.
#
#   UM LADO DO ERRO FOI ESCOLHIDO DE PROPÓSITO. Não alinhe o G3 ao a20 sem ler
#   isto.
#
# A W3 chegou a estender o filtro ao G3, sem conhecer a div. 83, e voltou atrás
# antes do merge (decisão do Marcel, 2026-09-16). O argumento contrário — o W1
# trocou "idênticas" por "⊆ com errata", e com isso o caminho de reprovação que
# motivou a 83 (linha NOVA vinda de comentário) deixou de reprovar; o que sobra
# é o SUMIU da div. 140, que agora bloqueia merge — está registrado no
# `W3-ENCERRAMENTO.md` como PROPOSTA DE REVISÃO PENDENTE. Se voltar com caso
# real, revisa-se a 83 por escrito, em PR própria, com o texto dela ao lado. O
# risco é latente: ZERO menções a `log(` em comentário na árvore de hoje.
#
# --- W4-a — A FORMA NOVA, E O QUE ELA FAZ COM A PROPOSTA PENDENTE -----------
#
# É aqui que a herança do `W3-ENCERRAMENTO.md` (§7, item 8) se cumpre: a razão
# da forma nova fica ESCRITA AO LADO DO TEXTO DA 83, no lugar onde quem mexer
# no gate vai ler. Foi essa distância — razão num anexo, decisão no script —
# que produziu a div. 142, e a regra 5 do catálogo diz que ela não se repete.
#
# **Por que a errata virou PAR** (div. 189, medida na N2-PR1): a forma da W1
# declarava só a linha que SAI. Apagar a velha sem pôr nada no lugar passava.
# A palavra *errata* promete "esta linha VIROU aquela"; o gate checava metade.
# Agora ele exige as duas pontas. **Isto não mexe na 83**: a 83 é sobre o que o
# COLETOR lê (texto cru, comentário incluído), e o coletor continua igual.
#
# **Mas muda um fato do argumento pendente, e o fato é contra o silêncio.** A
# proposta registrada na W3 dizia que, num SUMIU vindo de comentário (div. 140),
# "o único remédio que o script oferece é declarar na lista de ERRATAS uma
# 'linha de log' que nunca foi log — uma errata falsa no registro que existe
# para ser verdadeiro". **Esse remédio ACABOU.** Com o par, a errata falsa já
# não basta: seria preciso inventar TAMBÉM uma substituta e fazê-la aparecer
# entre as linhas adicionadas. A saída de emergência era ruim e agora está
# fechada — o que torna o argumento da proposta mais forte, não menos.
#
# **O W4-a NÃO decide a 83**, e isso é de propósito, pela razão que o Marcel já
# deu: não por quem acabou de mexer no gate, e não sem caso real. Medido de
# novo nesta PR: ZERO menções a `log(` em comentário na árvore. A proposta
# segue PENDENTE, com um fato a mais; o que fecha aqui é a DÍVIDA DE ESCRITA —
# a 83 e a razão da forma nova, juntas, neste arquivo.
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# W4-a — O GATE RECUSA CHAMADA SEM PAR (div. 187)
#
# A div. 187 nomeou o `g1.sh`. O `g2g3.sh` tinha o MESMO buraco, medido no CN
# desta PR: `sh g2g3.sh` sem argumento imprimia "G2: antes ⊆ depois ✓" e
# "G3: nenhuma linha sumiu ✓" com `antes=0 depois=0`, e saía 0. Consertar um
# dos dois irmãos e deixar o outro seria manter o buraco com metade do barulho.
# ---------------------------------------------------------------------------
A=$1; B=$2
uso() {
  echo "g2g3.sh: $1" >&2
  echo "uso: sh apps/native/scripts/g2g3.sh <ref-antes> <ref-depois|WORKTREE>" >&2
  echo "     da RAIZ do repositório. <ref-antes> é um ref git; <ref-depois> é" >&2
  echo "     um ref git ou a palavra WORKTREE (a árvore como está agora)." >&2
  exit 2
}
[ -n "$A" ] || uso "falta <ref-antes> — um gate diferencial sem par nao mede nada"
[ -n "$B" ] || uso "falta <ref-depois> — use um ref git ou a palavra WORKTREE"
git rev-parse --verify --quiet "$A^{commit}" >/dev/null || uso "<ref-antes> nao resolve: $A"
[ "$B" = "WORKTREE" ] || git rev-parse --verify --quiet "$B^{commit}" >/dev/null \
  || uso "<ref-depois> nao resolve: $B (e nao e a palavra WORKTREE)"
AQUI=$(dirname "$0")
SEM_COMENTARIO="$AQUI/sem-comentario.awk"
tmp=$(mktemp -d)
# As duas EXCLUSÕES DECLARADAS do escopo (W2): os testes e os instrumentos.
# `node_modules` sai por construção, não por decisão.
fora_do_escopo() {
  grep -vE '^\./' | grep -vE '^apps/native/(test|scripts)/' | grep -vE '(^|/)node_modules/'
}
# O texto do arquivo, CRU (G3) ou SEM COMENTÁRIO (G2) — ver o cabeçalho.
cru() {
  if [ "$1" = "WORKTREE" ]; then cat "$2"
  else git show "$1:$2" 2>/dev/null; fi
}
sem_comentario() {
  if [ "$1" = "WORKTREE" ]; then awk -f "$SEM_COMENTARIO" "$2"
  else git show "$1:$2" 2>/dev/null | awk -f "$SEM_COMENTARIO"; fi
}
coleta() {
  if [ "$1" = "WORKTREE" ]; then
    ARQS=$(find apps/native packages/core/src \( -name '*.ts' -o -name '*.tsx' \) | fora_do_escopo | sort)
  else
    ARQS=$(git ls-tree -r --name-only "$1" -- apps/native packages/core/src | grep -E '\.tsx?$' | fora_do_escopo | sort)
  fi
  for f in $ARQS; do
    sem_comentario "$1" "$f" | grep -o 'testID="[^"]*"' | sed "s|^|$f\t|"
    sem_comentario "$1" "$f" | grep -oE 'testID=\{`[^`]*`\}' | sed "s|^|$f\t|"
  done | sort -u > "$2"
  # G3: texto CRU, comentário incluído — div. 83.
  for f in $ARQS; do
    cru "$1" "$f" | grep 'log(' | sed 's/^ *//' | sed "s|^|$f\t|"
  done | sort > "$3"
}
coleta "$A" $tmp/a.ids $tmp/a.log
coleta "$B" $tmp/b.ids $tmp/b.log
echo "G2 — testIDs  antes=$(wc -l < $tmp/a.ids | tr -d ' ')  depois=$(wc -l < $tmp/b.ids | tr -d ' ')"
SUMIU=$(comm -23 $tmp/a.ids $tmp/b.ids)
if [ -z "$SUMIU" ]; then echo "  G2: antes ⊆ depois ✓"; G2=0
else echo "  G2: testID SUMIU ✗"; echo "$SUMIU" | sed 's/^/      /'; G2=1; fi
NOVO=$(comm -13 $tmp/a.ids $tmp/b.ids)
[ -n "$NOVO" ] && { echo "  testID NOVOS:"; echo "$NOVO" | sed 's/^/      /'; }
# ---------------------------------------------------------------------------
# G3 — A ERRATA É UM PAR: a linha que SAI e a que ENTRA no lugar dela.
#
# **W1.** De "idênticas" para "antes ⊆ depois, com ERRATA DECLARADA". Até ali
# nenhuma PR precisava acrescentar linha de log, e "idênticas" era a afirmação
# certa; a W1 existia justamente para acrescentar linhas que faltavam (div. 114:
# o `download-error` existia em UM lugar no app inteiro) e para mudar uma que
# dizia menos do que precisa dizer.
#
# **W4-a, div. 189 — a forma da W1 declarava só metade do par.** Medido no CN
# (`__cn__/cn-w4a.sh`; saída em `docs/native/W4A-anexos/`): com a errata
# declarada, APAGAR a linha velha — sem pôr nenhuma no lugar — dava *"as que
# sumiram estão na lista de erratas ✓"* e exit 0. Quer dizer: a errata, que
# existe para dizer **"esta linha VIROU aquela"**, autorizava **"esta linha
# SUMIU"**. O contrato de log podia encolher com a bênção do gate, e o G3 é o
# único lugar onde esse encolhimento apareceria — os aceites desta série são
# lidos PELO LOGCAT.
#
# Agora toda errata é um PAR, em DUAS linhas da lista abaixo — ímpar = a que
# SAI, par = a que ENTRA — e o gate exige as duas coisas:
#
#   1. toda linha que SUMIU tem de casar com a `velha` de algum par. Uma linha
#      que some fora da lista é contrato quebrado em silêncio, e é exatamente o
#      que um "⊆" cru deixaria passar;
#   2. a `nova` desse par tem de estar entre as linhas ADICIONADAS. Sem isto a
#      errata não é uma errata: é uma permissão de apagar.
#
# O CONTROLE POSITIVO importa tanto quanto o negativo, e está no mesmo CN: a
# mesma errata, com a substituta presente, PASSA. Um gate que apertasse até
# barrar a troca honesta teria trocado um defeito por outro.
#
# **Div. 195 — e a lista é podada a cada PR.** É a div. 141 outra vez, no outro
# irmão: a lista de erratas é ESTADO DE UMA PR guardado num arquivo que
# SOBREVIVE à PR. Errata velha nunca reprova nada — só deixa o gate mais
# permissivo, em silêncio, para a PR seguinte, que é o avesso do que uma errata
# declarada deve fazer. O remédio é o mesmo, e é proporcional: o gate IMPRIME
# as erratas que declarou e NÃO usou, alto, em toda corrida — e **não reprova
# por isso**, porque reprovar quebraria a regra de que o gate vem ANTES do que
# ele mede (o commit 1 declara o que só o commit 3 vai usar).
#
# **W4-b1, div. 339 — e agora reprova.** O aviso proporcional não sobreviveu
# ao CI: a `main` carregou exceção e par órfãos no `g1.sh` desde a N2-PR7, com
# o aviso impresso em toda corrida e o job verde. Errata (e remoção, abaixo)
# declarada e não usada passa a REPROVAR, como no `g1.sh`. As consequências —
# o commit 1 que declara antes de usar fica vermelho À MÃO, e a PR seguinte
# reprova até podar — estão escritas no cabeçalho do W4-b1 do `g1.sh`.
#
# ---------------------------------------------------------------------------
# W4-b1 — O PAR DE REMOÇÃO (N2-D34: o mecanismo que a div. 83 pedia)
#
# A 83 fica como está: o COLETOR continua lendo o texto CRU, comentário
# incluído, e uma linha `log(` que some — de código ou de comentário —
# continua reprovando como SUMIU. O que a N2-D34 decidiu é o que faltava do
# outro lado: quando a remoção é DE PROPÓSITO (um comentário que citava a
# linha de log e foi reescrito, por exemplo), ela se DECLARA, com razão, numa
# lista própria:
#
#     <linha, sem a indentação, IGUAL à que o G3 coletou> → REMOVIDA: <razão>
#
# e não numa errata falsa com substituta inventada — a saída de emergência
# que o par da div. 189 já tinha fechado (div. 216). Três regras:
#
#   1. a razão é obrigatória: `→ REMOVIDA:` sem texto depois reprova, como o
#      par sem razão do G1b;
#   2. a linha casa IGUAL (não subcadeia, ao contrário da `velha` da errata).
#      A errata tem contrapeso — a `nova` tem de aparecer —, a remoção não tem
#      nenhum; uma subcadeia como `log(` autorizaria o contrato inteiro a sumir;
#   3. remoção declarada cuja linha NÃO sumiu reprova (a regra de cima): ou a
#      linha ainda existe, e a declaração mente, ou é de uma PR já mergeada.
#
# --- AS ERRATAS DESTA PR ----------------------------------------------------
# Pares, uma linha `velha` seguida da `nova` que a substitui. A lista está
# VAZIA, e a poda é a correção da div. 195: as três que estavam aqui já tinham
# mergeado, e nenhuma podia voltar a casar com coisa alguma —
#
#   • W1 (`file src=download name=${name} bytes=${bytes}`): mergeada três PRs
#     antes. A linha de hoje (`files.ts:360`) já traz `total=` e `ms=`, e a
#     forma velha não existe em BASE nenhuma que este gate vá ver de novo.
#   • N2-PR1, as duas (`cache write kind=setlists|content … invalidated=0`):
#     mergeadas em `adf32e6`. Mesma coisa — o `store.ts` de qualquer BASE
#     daqui para a frente já tem `invalidated=${invalidated.<kind>}`.
#
# Lista vazia = NENHUMA linha de log pode sumir nesta PR. É a afirmação mais
# forte que a lista pode fazer, e é a verdadeira: o W4-a é PR de instrumento e
# não toca uma linha de `log(` do app.
ERRATAS=''
# --- AS REMOÇÕES DESTA PR ---------------------------------------------------
# Uma por linha, na forma do cabeçalho. VAZIA: o W4-b1 não remove linha de log.
REMOCOES=''
echo "G3 — linhas log( antes=$(wc -l < $tmp/a.log | tr -d ' ')  depois=$(wc -l < $tmp/b.log | tr -d ' ')"
echo "      ERRATAS DECLARADAS (pares velha -> nova; o escopo de log desta PR):"
if [ -n "$ERRATAS" ]; then printf '%s\n' "$ERRATAS" | sed 's/^/        /'
else echo "        (nenhuma)"; fi
echo "      REMOÇÕES DECLARADAS (linha → REMOVIDA: razão; N2-D34):"
if [ -n "$REMOCOES" ]; then printf '%s\n' "$REMOCOES" | sed 's/^/        /'
else echo "        (nenhuma)"; fi
[ -z "$ERRATAS" ] && [ -z "$REMOCOES" ] && echo "      — nenhuma linha de log pode sumir nesta PR"
SUMIRAM=$(comm -23 $tmp/a.log $tmp/b.log)
NOVAS=$(comm -13 $tmp/a.log $tmp/b.log)
G3=0

# A lista, partida em `velha` (ímpar) e `nova` (par). Lista vazia => arquivos
# vazios => nenhuma linha pode sumir. NUNCA usar `grep -F ""` aqui: padrão
# vazio casa com TUDO, e uma lista vazia viraria permissão universal.
printf '%s' "$ERRATAS" | grep . > $tmp/err.todas
N_ERR=$(grep -c . $tmp/err.todas)
awk 'NR % 2 == 1' $tmp/err.todas > $tmp/err.velha
awk 'NR % 2 == 0' $tmp/err.todas > $tmp/err.nova
if [ $((N_ERR % 2)) -ne 0 ]; then
  echo "  G3: lista de ERRATAS com $N_ERR linhas — toda errata é um PAR velha/nova ✗"
  G3=1
fi
# A lista de remoções, partida em `linha` e razão. A linha é o texto ANTES da
# primeira ` → REMOVIDA:`; a razão, o que vem depois, e não pode ser branca.
printf '%s\n' "$REMOCOES" | grep . > $tmp/rem.todas
: > $tmp/rem.linha
while IFS= read -r R; do
  case "$R" in
    *' → REMOVIDA:'*) ;;
    *) echo "  G3: REMOÇÃO MAL FORMADA ✗ — a forma é '<linha> → REMOVIDA: <razão>':"
       echo "      $R"; G3=1; continue ;;
  esac
  RAZAO=${R#* → REMOVIDA:}
  case "$RAZAO" in
    *[![:space:]]*) ;;
    *) echo "  G3: REMOÇÃO SEM RAZÃO ✗ — uma remoção sem razão é uma decisão sem autor:"
       echo "      $R"; G3=1; continue ;;
  esac
  printf '%s\n' "${R%% → REMOVIDA:*}" >> $tmp/rem.linha
done < $tmp/rem.todas

if [ -n "$SUMIRAM" ]; then
  echo "  linhas que SUMIRAM (cada uma precisa de um PAR de errata com a substituta, ou de uma REMOÇÃO declarada):"
  echo "$SUMIRAM" | sed 's/^/      /'
  echo "$SUMIRAM" | while IFS= read -r L; do
    [ -n "$L" ] || continue
    # Remoção declarada: a linha (sem o `arquivo<TAB>`) casa IGUAL.
    grep -qxF -- "${L#*	}" $tmp/rem.linha && continue
    I=0; ACHOU=0
    while IFS= read -r V; do
      I=$((I + 1))
      case "$L" in *"$V"*) ACHOU=$I; break ;; esac
    done < $tmp/err.velha
    if [ "$ACHOU" -eq 0 ]; then
      echo "  G3: linha sumiu SEM ERRATA NEM REMOÇÃO ✗"
      echo "      $L"
      exit 1
    fi
    NOVA=$(sed -n "${ACHOU}p" $tmp/err.nova)
    if ! printf '%s\n' "$NOVAS" | grep -qF -- "$NOVA"; then
      echo "  G3: ERRATA SEM SUBSTITUTA ✗ (div. 189) — a linha saiu e a do par não entrou:"
      echo "      saiu:          $L"
      echo "      devia entrar:  $NOVA"
      exit 1
    fi
  done || G3=1
  [ $G3 -eq 0 ] && echo "  G3: cada linha que sumiu tem par de errata com a substituta, ou remoção declarada ✓"
else
  echo "  G3: nenhuma linha sumiu ✓"
fi
if [ -n "$NOVAS" ]; then echo "  linhas NOVAS (declarar no commit e no catálogo):"; echo "$NOVAS" | sed 's/^/      /'; fi

# --- Div. 195 → W4-b1, div. 339: errata declarada que NÃO foi usada ---------
# Reprova (ver o cabeçalho) — o gêmeo da exceção órfã do `g1.sh`.
NAOUSADAS=''
I=0
while IFS= read -r V; do
  I=$((I + 1))
  [ -n "$V" ] || continue
  printf '%s\n' "$SUMIRAM" | grep -qF -- "$V" && continue
  NAOUSADAS="$NAOUSADAS$V
      -> $(sed -n "${I}p" $tmp/err.nova)
"
done < $tmp/err.velha
if [ -n "$NAOUSADAS" ]; then
  echo "  G3: ERRATA DECLARADA E NÃO USADA ✗ — poda (divs. 195, 339):"
  printf '%s' "$NAOUSADAS" | sed 's/^/        /'
  G3=1
fi
# --- N2-D34: remoção declarada cuja linha NÃO sumiu -------------------------
printf '%s\n' "$SUMIRAM" | sed 's/^[^	]*	//' > $tmp/sumiram.texto
NAOUSADAS=''
while IFS= read -r V; do
  grep -qxF -- "$V" $tmp/sumiram.texto && continue
  NAOUSADAS="$NAOUSADAS$V
"
done < $tmp/rem.linha
if [ -n "$NAOUSADAS" ]; then
  echo "  G3: REMOÇÃO DECLARADA E NÃO USADA ✗ — a linha não sumiu (N2-D34, div. 339):"
  printf '%s' "$NAOUSADAS" | sed 's/^/        /'
  G3=1
fi

rm -rf $tmp
[ $G2 -eq 0 ] && [ $G3 -eq 0 ]
