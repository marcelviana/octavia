// G-tok, CN de falso positivo (I1-PR5, decisão 622): palavra do vocabulário em IDENTIFICADOR
// não é texto e não acusa. O CN acrescenta `<p>New content</p>` e aí acusa. Não é importado.
interface Props { fileUrl: string }

export function CnFalsoPositivo({ fileUrl }: Props) {
  const newContent = fileUrl.length > 0
  return <div data-arquivo={fileUrl}>{newContent ? fileUrl : null}</div>
}
