#!/bin/sh
# W4-b2, H3 (div. 348): as declarações dos gates diferenciais saem da `main`.
#
# Até o W4-b1 a exceção do G1a, o par do G1b e a errata/remoção do G3 eram
# LISTAS DENTRO DOS SCRIPTS — estado de uma PR guardado num arquivo que
# sobrevive à PR (div. 141). Com a órfã reprovando (div. 339), a poda virou
# condição de merge, e a PR SEGUINTE, de docs inclusive, herdava a obrigação de
# podar o que a anterior declarou (div. 348). Agora a declaração mora onde a PR
# mora: num bloco do CORPO da PR, que este script extrai. No CI, as listas
# locais dos scripts têm de estar VAZIAS (CN-H3c); fora do CI elas continuam
# servindo para rodar à mão.
#
# O CONTRATO (documentado no `docs/native/LOGS-OCTAVIA.md`, "Errata W4-b2"):
#
#     ```gates
#     # comentário e linha em branco são ignorados
#     g1a: <caminho>                          exceção do G1a, um por linha
#     g1b-velha: <linha que sai do teste>     par do G1b — as TRÊS, nesta ordem
#     g1b-nova: <linha que entra no lugar>
#     g1b-razao: <razão>
#     g3-velha: <linha de log que sai>        errata do G3 — as DUAS, nesta ordem
#     g3-nova: <linha que entra no lugar>
#     g3-removida: <linha> → REMOVIDA: <razão>   remoção do G3 (N2-D34)
#     ```
#
# O valor vai verbatim até o fim da linha (sem o `\r` de corpo editado na web);
# as regras de cada lista — casar IGUAL ou por subcadeia, razão obrigatória,
# órfã reprova — continuam nos scripts, que recebem as linhas como se fossem a
# lista local. Aqui só se recusa o que tornaria a leitura AMBÍGUA: chave
# desconhecida, valor vazio, par fora de ordem ou incompleto, bloco não fechado,
# mais de um bloco. Corpo sem bloco = nenhuma declaração, que é o caso comum.
#
# Uso: <corpo da PR> | sh apps/native/scripts/gates-decl.sh > decl
#      GATES_DECL=decl sh apps/native/scripts/g1.sh <base> <head>
# À mão, com a PR aberta:
#      gh pr view <n> --json body -q .body | sh apps/native/scripts/gates-decl.sh > /tmp/decl
awk '
  function erro(m) { printf "gates-decl: %s (linha %d do corpo)\n", m, NR > "/dev/stderr"; falhou = 1; exit 1 }
  { sub(/\r$/, "") }
  !dentro && /^```gates[[:space:]]*$/ { if (++blocos > 1) erro("mais de um bloco ```gates"); dentro = 1; next }
  dentro && /^```[[:space:]]*$/ { dentro = 0; next }
  !dentro { next }
  /^[[:space:]]*$/ || /^[[:space:]]*#/ { next }
  {
    i = index($0, ": ")
    if (i == 0) erro("linha sem \"chave: valor\": " $0)
    k = substr($0, 1, i - 1); v = substr($0, i + 2)
    if (v !~ /[^[:space:]]/) erro("valor vazio: " k)
    if (esp != "" && k != esp) erro("fora de ordem: esperava " esp ", veio " k)
    if      (k == "g1a" || k == "g3-removida") esp = ""
    else if (k == "g1b-velha") esp = "g1b-nova"
    else if (k == "g1b-nova")  { if (esp == "") erro("fora de ordem: g1b-nova sem g1b-velha antes"); esp = "g1b-razao" }
    else if (k == "g1b-razao") { if (esp == "") erro("fora de ordem: g1b-razao sem o par antes"); esp = "" }
    else if (k == "g3-velha")  esp = "g3-nova"
    else if (k == "g3-nova")   { if (esp == "") erro("fora de ordem: g3-nova sem g3-velha antes"); esp = "" }
    else erro("chave desconhecida: " k)
    print k ": " v
  }
  END {
    if (falhou) exit 1
    if (dentro) erro("bloco ```gates não fechado")
    if (esp != "") erro("registro incompleto: faltou " esp)
  }
'
