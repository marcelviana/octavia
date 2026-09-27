// G-tok, controle negativo (I1-PR5): um literal de cada classe que o G-tok (ii)
// reprova — cor, tamanho de fonte e texto em inglês. Não é importado por nada;
// só entra na lista do G-tok durante o CN (docs/ux/I1-PR5-anexos/cn/g-tok.txt).
const css = '.cn-g-tok { font-size: 14px }'

export function CnGTok() {
  return (
    <div style={{ color: '#ff0000' }}>
      <style>{css}</style>
      <p>{"Loading..."}</p>
    </div>
  )
}
