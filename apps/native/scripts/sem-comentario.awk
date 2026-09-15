# Apaga COMENTÁRIO de um arquivo .ts/.tsx, preservando linhas e colunas de tudo
# o que não é comentário. Filtro puro: lê o arquivo, escreve o mesmo número de
# linhas. Usado pelo `g2g3.sh` — e só por ele, por enquanto.
#
# POR QUE ELE EXISTE (div. 136, achada pela W2; div. 140, medida pela W3)
#
# O `coleta()` do `g2g3.sh` grepa `testID="…"` e `log(` no texto CRU do arquivo.
# Uma MENÇÃO dentro de comentário é contada como se fosse código. A W2 achou
# isso ao documentar o `files.ts`, chamou de falso positivo e contornou
# escrevendo a documentação de outro jeito.
#
# **O falso positivo não é inerte, e é isto que a W3 mede.** Assim que a menção
# entra na população do ANTES, editar o comentário a faz SUMIR — e o G2 reprova
# por "testID SUMIU" e o G3 por "linha sumiu SEM ERRATA". Não é ruído: é
# REPROVAÇÃO FALSA, num gate que a partir desta PR IMPEDE (div. 129). Medido no
# anexo A §2: com uma menção plantada em comentário no `files.ts`, os dois lados
# do gate ficam vermelhos ao se apagar o comentário, e o código não mudou.
#
# A REGRA, E ELA NÃO É NOVA: é a MESMA que o `a20.mjs` já aplica desde a V1-PR3
# ("tira comentários: comentário não é texto de UI") — bloco de barra-estrela e
# linha de duas barras NÃO precedida de dois-pontos (a guarda que salva o
# esquema de URI). O projeto passa a ter UMA regra de comentário, escrita num
# lugar só, e não duas parecidas.
#
# O que ele NÃO cobre, e vai declarado: abertura de comentário dentro de literal
# de string ou de regex seria tratada como comentário. Na árvore de hoje isso
# não acontece — MEDIDO: a população antes e depois do filtro é IDÊNTICA,
# 43 testIDs e 57 linhas de log, os mesmos conjuntos (anexo A §3). Se um dia
# divergir, o sintoma é uma linha sumindo sem ninguém a ter tocado, e esta é a
# linha a mexer.
BEGIN { bloco = 0 }
{
  linha = $0; saida = ""
  while (linha != "") {
    if (bloco) {
      p = index(linha, "*/")
      if (p == 0) { linha = ""; break }
      linha = substr(linha, p + 2); bloco = 0; continue
    }
    pb = index(linha, "/*")
    pl = index(linha, "//")
    # a guarda do `a20.mjs`: duas barras precedidas de `:` são esquema de URI
    while (pl > 1 && substr(linha, pl - 1, 1) == ":") {
      resto = substr(linha, pl + 2)
      p2 = index(resto, "//")
      if (p2 == 0) { pl = 0; break }
      pl = pl + 1 + p2
    }
    if (pb > 0 && (pl == 0 || pb < pl)) {
      saida = saida substr(linha, 1, pb - 1); linha = substr(linha, pb + 2); bloco = 1; continue
    }
    if (pl > 0) { saida = saida substr(linha, 1, pl - 1); linha = ""; break }
    saida = saida linha; linha = ""
  }
  sub(/[ \t]+$/, "", saida)
  print saida
}
