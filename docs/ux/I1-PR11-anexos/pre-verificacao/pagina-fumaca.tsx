"use client"
/**
 * I1-PR-11 — a página de FUMAÇA da pré-verificação sem sessão. O roteiro a copia para
 * `app/fumaca-i1pr11/[estado]/page.tsx` numa CÓPIA da árvore antes de subir o `next dev` (sem `.env`) e a apaga no fim;
 * nunca é commitada em `app/`. Monta os componentes REAIS do editor com os exemplos da folha
 * (`scripts/gates-web/g-faixa-editor-exemplos.ts`): o `ContentEditPageClient` (a casca e o editor), o `ContentEditor`
 * com `salvando`/`falhaAoSalvar` (o salvar não sai daqui: sem `.env` não há token), e a `TelaDeEstado` com as mesmas
 * props que a rota passa. `EDIT-sem-usuario` também é daqui: a rota real `/content/g-faixa/edit` sem cookie de sessão
 * é redirecionada ao `/login` pelo middleware (307, medido) — a tela é a mesma `TelaDeEstado` que a rota desenha para
 * `!user` (e o Vitest do editor prova o ramo).
 */
import { useParams } from "next/navigation"
import ContentEditPageClient from "@/components/content-edit-page-client"
import { ContentEditor } from "@/components/content-editor"
import { Casca } from "@/components/identidade/casca"
import { TelaDeEstado } from "@/components/editors/tela-de-estado"
import { FRASES_EDIT } from "@/components/editors/frases-editor"
import { linhaDaCarga, linhaDoSalvar } from "@/components/editors/falhas-do-editor"
import { EXEMPLOS_EDITOR } from "@/scripts/gates-web/g-faixa-editor-exemplos"

const erro = (e: "rede" | "auth" | "limite" | "servidor") => {
  const l = linhaDaCarga(e)
  return <TelaDeEstado testid="edit-erro" acoes falha={{ tipo: l.tipo, motivo: l.motivo, onTentar: l.tentar ? () => undefined : undefined }} />
}
const salvarErro = linhaDoSalvar("rede")
/* eslint-disable @typescript-eslint/no-explicit-any */
const TELAS: Record<string, () => JSX.Element> = {
  "EDIT-cifra": () => <ContentEditPageClient content={EXEMPLOS_EDITOR.cifra as any} />,
  "EDIT-sem-mudancas": () => <ContentEditPageClient content={EXEMPLOS_EDITOR.cifra as any} />,
  "EDIT-tab": () => <ContentEditPageClient content={EXEMPLOS_EDITOR.tab as any} />,
  "EDIT-letra": () => <ContentEditPageClient content={EXEMPLOS_EDITOR.letra as any} />,
  "EDIT-salvando": () => <Casca><ContentEditor content={EXEMPLOS_EDITOR.cifra} onSave={() => undefined} onCancel={() => undefined} salvando /></Casca>,
  "EDIT-salvar-erro": () => (
    <Casca>
      <ContentEditor content={EXEMPLOS_EDITOR.cifra} onSave={() => undefined} onCancel={() => undefined}
        falhaAoSalvar={{ tipo: salvarErro.tipo, motivo: salvarErro.motivo, detalhe: FRASES_EDIT["digitado-fica"], onTentar: () => undefined }} />
    </Casca>
  ),
  "EDIT-carregando-auth": () => <TelaDeEstado testid="edit-carregando-sessao" frase={FRASES_EDIT["estado.carregando"]} />,
  "EDIT-sem-usuario": () => <TelaDeEstado testid="edit-carregando-sessao" frase={FRASES_EDIT["estado.carregando"]} />,
  "EDIT-carregando": () => <TelaDeEstado testid="edit-carregando" frase={FRASES_EDIT["edit.carregando"]} />,
  "EDIT-carregando-editor": () => <TelaDeEstado testid="edit-carregando-editor" frase={FRASES_EDIT["edit.carregando.editor"]} />,
  "EDIT-erro-rede": () => erro("rede"),
  "EDIT-erro-auth": () => erro("auth"),
  "EDIT-erro-limite": () => erro("limite"),
  "EDIT-erro-servidor": () => erro("servidor"),
  "EDIT-404": () => <TelaDeEstado testid="edit-nao-existe" frase={FRASES_EDIT["edit.nao-existe"]} acoes />,
}

export default function Fumaca() {
  const { estado } = useParams<{ estado: string }>()
  const T = TELAS[estado]
  return T ? <T /> : <p>fumaça: estado ausente</p>
}
