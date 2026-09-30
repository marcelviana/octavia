"use client"

/**
 * O criar do zero (I1-PR-12; folha `7-upload`, `UP-criar`, `UP-criar-validacao`; decisão 5 do aval): o *Título* e o
 * *Próximo* — sem campo de corpo. O rascunho que sobe é o de antes com o texto vazio
 * (`{ type, content: { [chave do tipo]: "" }, title }`): o corpo se escreve no editor (superfície 6). A validação
 * (*o título é obrigatório*) fica sob o campo, com o contorno em `errorInk` — era um alerta acima do cartão. O ramo de
 * escolha de tipo (morto: `hideTypeSelection` era sempre `true`), o texto de 12 linhas e as dez dicas saíram.
 */
import { useState } from "react"
import { ContentType, CONTENT_TYPE_KEYS } from "@/types/content"
import { BotaoDoPasso, Botoes, Campo, Validacao, campoDeUmaLinha } from "@/components/upload/pecas"
import { FRASES_UP } from "@/components/upload/frases-upload"

export interface Rascunho { type: ContentType; content: Record<string, string>; title: string }

interface ContentCreatorProps {
  tipo: ContentType
  onContentCreated: (content: Rascunho) => void
  onVoltar: () => void
}

export function ContentCreator({ tipo, onContentCreated, onVoltar }: ContentCreatorProps) {
  const [title, setTitle] = useState("")
  const [semTitulo, setSemTitulo] = useState(false)

  const handleCreate = () => {
    if (!title.trim()) {
      setSemTitulo(true)
      return
    }
    onContentCreated({ type: tipo, content: { [CONTENT_TYPE_KEYS[tipo]]: "" }, title: title.trim() })
  }

  return (
    <>
      <Campo rotulo={FRASES_UP["up.criar.titulo"]} id="up-criar-titulo">
        <input id="up-criar-titulo" data-testid="campo-criar-titulo" value={title} placeholder={FRASES_UP["up.meta.titulo.exemplo"]}
          aria-invalid={semTitulo} className={campoDeUmaLinha(semTitulo)}
          onChange={(e) => { setTitle(e.target.value); setSemTitulo(false) }} />
        {semTitulo && <Validacao frase={FRASES_UP["up.titulo-obrigatorio"]} />}
      </Campo>
      <Botoes>
        <BotaoDoPasso rotulo={FRASES_UP["acao.voltar"]} onClick={onVoltar} />
        <BotaoDoPasso rotulo={FRASES_UP["up.proximo"]} icone="garantida" escrita onClick={handleCreate} />
      </Botoes>
    </>
  )
}
