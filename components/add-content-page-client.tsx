"use client"

/**
 * A rota do upload, do lado do cliente (I1-PR-12; folha `7-upload`). Os três carregamentos de antes — o `isLoading` do
 * Firebase (*"Loading..."*, fora da casca), o pedaço do `dynamic` (*"Loading add content..."*) e o sem usuário
 * (`return null`: tela em branco) — são UM, na casca: o título e *carregando…* (`UP-carregando`; resposta 14). O
 * *Adicionar* da casca, já aqui, reinicia o formulário, como antes; criado o content, a tela vai a `/content/{id}`,
 * como antes.
 */
import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import type { Database } from "@/types/database.types"
import { Casca, ConteudoDaCasca } from "@/components/identidade/casca"
import { TituloDaTela } from "@/components/identidade/controles"
import { Espera } from "@/components/upload/pecas"
import { FRASES_UP } from "@/components/upload/frases-upload"
import { useAuth } from "@/contexts/firebase-auth-context"
import logger from "@/lib/logger"

type Content = Database["public"]["Tables"]["content"]["Row"]

function Carregando() {
  return (
    <ConteudoDaCasca>
      <div className="flex flex-wrap items-center justify-between gap-espaco-lg">
        <TituloDaTela>{FRASES_UP["up.titulo"]}</TituloDaTela>
      </div>
      <Espera frase={FRASES_UP["estado.carregando"]} />
    </ConteudoDaCasca>
  )
}

const AddContent = dynamic(() => import("@/components/add-content").then((mod) => ({ default: mod.AddContent })), {
  loading: () => <Carregando />,
})

export default function AddContentPageClient() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [resetKey, setResetKey] = useState(0)

  // "Adicionar" de novo, já nesta tela, reinicia o formulário (a chave remonta o componente)
  const handleNavigate = (screen: string) => {
    if (screen === "add-content") setResetKey((k) => k + 1)
    else router.push(`/${screen}`)
  }

  const handleContentCreated = (content: Content) => {
    if (!content?.id) {
      logger.error("Upload: o content criado veio sem id")
      return
    }
    router.push(`/content/${content.id}`)
  }

  return (
    <Casca aoReclicarAtivo={() => handleNavigate("add-content")}>
      {isLoading || !user
        ? <Carregando />
        : <AddContent key={resetKey} onNavigate={handleNavigate} onContentCreated={handleContentCreated} />}
    </Casca>
  )
}
