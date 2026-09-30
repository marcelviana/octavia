"use client"

/**
 * O diálogo de apagar a setlist (I1-PR-13; folha `8-setlists`: `SET-apagar`, `SET-apagar-erro`). A pergunta em
 * `size.body` · `lineHeight.text`; *Cancelar* e *Apagar* (contorno e ícone `errorInk`). Na falha a linha fica DENTRO do
 * diálogo, abaixo da pergunta, SEM *Tentar de novo* (decisão 25: quem repete é o *Apagar*). O 404 não chega aqui: o
 * gerente fecha o diálogo e relê a lista (`SET-ja-apagada`).
 */
import { Cancelar, Confirmar, Dialogo } from "@/components/setlists/dialogo"
import { linhaDaFalha } from "@/components/setlists/falhas-das-setlists"
import { FRASES_SET, fraseSet } from "@/components/setlists/frases-setlists"

interface Props { nome: string; enviando: boolean; erro: unknown | null; onApagar: () => void; onFechar: () => void }

export function ApagarSetlist({ nome, enviando, erro, onApagar, onFechar }: Props) {
  return (
    <Dialogo
      titulo={FRASES_SET["set.apagar.titulo"]}
      onFechar={onFechar}
      preso={enviando}
      falha={erro ? linhaDaFalha("set.erro.apagar", erro) : null}
      falhaAbaixo
      botoes={<>
        <Cancelar onClick={() => { if (!enviando) onFechar() }} />
        <Confirmar perigo rotulo={FRASES_SET["set.apagar.confirmar"]} icone="apagar-setlist" onClick={() => { if (!enviando) onApagar() }} />
      </>}
    >
      <p className="text-tam-body leading-entrelinha-text">{fraseSet("set.apagar.pergunta", { nome })}</p>
    </Dialogo>
  )
}
