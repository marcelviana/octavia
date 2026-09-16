# Apaga COMENTÁRIO de um arquivo .ts/.tsx, preservando linhas e colunas de tudo
# o que não é comentário. Filtro puro: lê o arquivo, escreve o mesmo número de
# linhas. Usado pelo coletor do **G2** no `g2g3.sh` — e SÓ por ele.
#
# POR QUE ELE EXISTE (div. 136, achada pela W2; div. 140, medida pela W3)
#
# O coletor do G2 grepa `testID="…"` no texto CRU do arquivo, e uma MENÇÃO
# dentro de comentário é contada como prop. Com a menção na BASE, editar o
# comentário a faz SUMIR e o G2 reprova por "testID SUMIU" sem que o código
# mude — REPROVAÇÃO FALSA, num gate que a partir da W3 impede (div. 129).
#
# POR QUE ELE **NÃO** SERVE O G3 — div. 83, e não é esquecimento. O G3 é gate de
# INVARIÂNCIA e erra, de propósito, para o lado de falar demais. A razão inteira
# está no cabeçalho do `g2g3.sh`. O projeto tem DUAS políticas de comentário, e
# elas são deliberadas: o `a20.mjs` e o G2 tiram, o G3 não.
#
# A regra do filtro é a mesma do `a20.mjs` — bloco de barra-estrela e linha de
# duas barras NÃO precedida de dois-pontos (a guarda do esquema de URI).
#
# O que ele NÃO cobre, e vai declarado: abertura de comentário dentro de literal
# de string ou de regex seria tratada como comentário. Na árvore de hoje isso
# não acontece — MEDIDO: a população de testIDs antes e depois do filtro é
# IDÊNTICA, 43, os mesmos conjuntos (anexo A §3). Se um dia divergir, o sintoma
# é um testID sumindo sem ninguém o ter tocado, e esta é a linha a mexer.
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
