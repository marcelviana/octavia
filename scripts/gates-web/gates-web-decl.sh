#!/bin/sh
# I1-PR5 (I1-D20): o extrator do bloco ```gates-web``` do CORPO da PR — o irmão
# do `apps/native/scripts/gates-decl.sh`, que NÃO muda e continua lendo só o
# bloco ```gates``` (a abertura dele é `^```gates[[:space:]]*$`, que não casa
# com ```gates-web```; o CN da I1-D20 está no anexo da I1-PR5).
#
# O CONTRATO:
#
#     ```gates-web
#     # comentário e linha em branco são ignorados
#     gback: <caminho> — <razão>     exceção do G-back: o arquivo do núcleo que
#                                    esta PR muda (ou que entra no núcleo), com
#                                    a razão depois de " — ". Várias linhas para
#                                    o mesmo caminho valem (uma por razão).
#     grotas: <texto>                registro, sem gate que o leia (div. 504:
#     gpalco: <texto>                o par do G-rotas e o escopo do G-palco são
#                                    declarados em texto; o G-palco lê a
#                                    lista-do-corte.txt, não o corpo)
#     gtok: <texto>                  registro (I1-PR6, div. 664): o crescimento
#                                    da lista do G-tok, declarado no corpo
#     gfaixa: <texto>                registro (I1-PR6, div. 679): mudança de regra
#                                    do veredito do G-faixa, declarada no corpo
#     ```
#
# Aqui só se recusa o que tornaria a leitura AMBÍGUA: chave desconhecida, valor
# vazio, `gback` sem " — <razão>", bloco não fechado, mais de um bloco. Corpo
# sem bloco = nenhuma declaração. As regras do G-back (declaração órfã,
# arquivo do núcleo sem declaração) estão no `g-back.sh`, que recebe as linhas.
#
# Uso: <corpo da PR> | sh scripts/gates-web/gates-web-decl.sh > decl
#      GATES_WEB_DECL=decl sh scripts/gates-web/g-back.sh <base> <head|WORKTREE>
# À mão: gh pr view <n> --json body -q .body | sh scripts/gates-web/gates-web-decl.sh
awk '
  function erro(m) { printf "gates-web-decl: %s (linha %d do corpo)\n", m, NR > "/dev/stderr"; falhou = 1; exit 1 }
  { sub(/\r$/, "") }
  !dentro && /^```gates-web[[:space:]]*$/ { if (++blocos > 1) erro("mais de um bloco ```gates-web"); dentro = 1; next }
  dentro && /^```[[:space:]]*$/ { dentro = 0; next }
  !dentro { next }
  /^[[:space:]]*$/ || /^[[:space:]]*#/ { next }
  {
    i = index($0, ": ")
    if (i == 0) erro("linha sem \"chave: valor\": " $0)
    k = substr($0, 1, i - 1); v = substr($0, i + 2)
    if (v !~ /[^[:space:]]/) erro("valor vazio: " k)
    if (k == "gback") {
      j = index(v, " — ")
      if (j <= 1) erro("gback sem \"<caminho> — <razão>\": " v)
      r = substr(v, j + length(" — "))
      if (r !~ /[^[:space:]]/) erro("gback sem razão: " v)
    } else if (k != "grotas" && k != "gpalco" && k != "gtok" && k != "gfaixa") erro("chave desconhecida: " k)
    print k ": " v
  }
  END {
    if (falhou) exit 1
    if (dentro) erro("bloco ```gates-web não fechado")
  }
'
