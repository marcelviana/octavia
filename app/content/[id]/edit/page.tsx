"use client"

/**
 * `/content/[id]/edit` (I1-PR-11; folha `6-content-editor`). A carga é a de antes (`getContentById` → `GET
 * /api/content/<id>`, com o usuário do Firebase de pé). O que mudou, decidido no aval:
 * - todos os estados na casca (decisão 4): *carregando…* na espera da sessão e sem usuário (antes, `return null` —
 *   a tela em branco, resposta 14); *carregando o conteúdo…*; *carregando o editor…* (UM `dynamic` — eram dois
 *   aninhados, div. 787);
 * - a falha da carga com o motivo da ESPÉCIE (decisão 3; antes, *"Content Not Found"* + *"Failed to load content for
 *   editing."* para rede, 401, 429, 5xx e 404): rede e 5xx com *Tentar de novo* (uma carga por clique); 401/403 e 429
 *   sem; 404, 400 (id malformado) e o corpo nulo → *este conteúdo não existe*, sem linha (nota da folha).
 */
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import { useFirebaseAuth } from "@/contexts/firebase-auth-context"
import { getContentById } from "@/lib/content-service"
import { TelaDeEstado } from "@/components/editors/tela-de-estado"
import { FRASES_EDIT } from "@/components/editors/frases-editor"
import { especieDaCarga, linhaDaCarga, type EspecieDaCarga } from "@/components/editors/falhas-do-editor"
import logger from "@/lib/logger"
import type { Database } from "@/types/database.types"

const ContentEditPageClient = dynamic(() => import("@/components/content-edit-page-client"), {
  loading: () => <TelaDeEstado testid="edit-carregando-editor" frase={FRASES_EDIT["edit.carregando.editor"]} />,
})

type Content = Database["public"]["Tables"]["content"]["Row"]

export default function EditContentPage() {
  const params = useParams()
  const { user, isLoading } = useFirebaseAuth()
  const [content, setContent] = useState<Content | null>(null)
  const [contentLoading, setContentLoading] = useState(true)
  const [erro, setErro] = useState<EspecieDaCarga | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let mounted = true
    const loadContent = async (contentId: string) => {
      try {
        if (mounted) setContentLoading(true)
        if (mounted) setErro(null)
        const data = await getContentById(contentId)
        if (mounted) setContent(data)
      } catch (err) {
        logger.error("Editor: falha ao carregar o conteúdo", err)
        if (mounted) setErro(especieDaCarga(err))
      } finally {
        if (mounted) setContentLoading(false)
      }
    }
    if (params.id && user) loadContent(params.id as string)
    return () => {
      mounted = false
    }
  }, [params.id, user, tentativa])

  if (isLoading || !user) return <TelaDeEstado testid="edit-carregando-sessao" frase={FRASES_EDIT["estado.carregando"]} />
  if (contentLoading) return <TelaDeEstado testid="edit-carregando" frase={FRASES_EDIT["edit.carregando"]} />
  if (erro === "nao-existe" || (!erro && !content)) return <TelaDeEstado testid="edit-nao-existe" frase={FRASES_EDIT["edit.nao-existe"]} acoes />
  if (erro) {
    const linha = linhaDaCarga(erro)
    return (
      <TelaDeEstado
        testid="edit-erro"
        acoes
        falha={{ tipo: linha.tipo, motivo: linha.motivo, onTentar: linha.tentar ? () => setTentativa((n) => n + 1) : undefined }}
      />
    )
  }
  return <ContentEditPageClient content={content as Content} />
}
