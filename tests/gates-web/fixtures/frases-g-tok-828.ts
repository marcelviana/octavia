// G-tok, CN da div. 828 (I1-PR14): um ARQUIVO DE FRASES (`frases-*.ts`) — todo valor de chave e todo literal de
// template é texto, menos `valor:` (o dado gravado). Não é importado.
// ACUSA (2): "Next page" (valor de chave) e `${n} songs` (template). NÃO ACUSA: o `valor` "Standard", os rótulos pt-BR.
export const FRASES_CN = {
  "cn.proxima": "Next page",
  "cn.voltar": "Voltar",
} as const
export const contagem = (n: number) => `${n} songs`
export const AFINACOES_CN = [{ valor: "Standard (EADGBE)", rotulo: "Padrão (EADGBE)" }]
