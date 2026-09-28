"use client"

/**
 * A partitura (I1-PR-10; folha 5, `VIEW-partitura`, `-partitura-cheia`, `-carregando-pdf`, `-vazio-partitura`,
 * `-erro-formato`, `-erro-pdf`). O tipo do arquivo continua vindo da EXTENSÃO do `file_url` (I1-D36):
 * `.pdf` → o `PdfViewer` (a tela desenha a falha dele, acima do painel); imagem → no painel, no lugar do papel
 * (decisão 9), e a falha de carga — antes muda — vira a linha com `motivo.generico` e *Tentar de novo*; outra
 * extensão → `view.erro.formato` SEM *Tentar de novo* (I1-E17: repetir não muda a extensão). Sem arquivo: a
 * `notation` em texto no corpo mono (decisão 10) ou o vazio.
 */
import { useEffect, useState } from "react"
import Image from "next/image"
import PdfViewer from "@/components/pdf-viewer"
import type { FalhaDoPdf } from "@/components/pdf-viewer"
import type { FalhaDaTela } from "@/components/identidade/linha-da-tela"
import { CentroDoPainel, CorpoMono, Painel } from "@/components/content/painel"
import { textoDaNotacao } from "@/components/content/corpo-de-texto"
import { FRASES_VIEW, fraseCom, rotuloDoTipo } from "@/components/content/frases-visualizacao"
import { dadosDe, type ConteudoVisto } from "@/components/content/tipos"
import { isImageFile, isPdfFile } from "@/lib/utils"

export type ArquivoDaPartitura = "pdf" | "imagem" | "formato" | null

export function arquivoDe(url: string | null): ArquivoDaPartitura {
  if (!url) return null
  return isPdfFile(url) ? "pdf" : isImageFile(url) ? "imagem" : "formato"
}

interface Props { content: ConteudoVisto; aoFalhar: (falha: FalhaDaTela | null) => void }

export function SheetMusicDisplay({ content, aoFalhar }: Props) {
  const url = content.file_url || null
  const arquivo = arquivoDe(url)
  const [imagemFalhou, setImagemFalhou] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (arquivo === "formato") aoFalhar({ tipo: "falha", motivo: FRASES_VIEW["view.erro.formato"] })
    else if (arquivo === "imagem" && imagemFalhou) {
      aoFalhar({
        tipo: "falha",
        motivo: fraseCom("view.erro.imagem", { motivo: FRASES_VIEW["motivo.generico"] }),
        onTentar: () => { setImagemFalhou(false); setTentativa((n) => n + 1) },
      })
    } else if (arquivo !== "pdf") aoFalhar(null)
  }, [arquivo, imagemFalhou]) // eslint-disable-line react-hooks/exhaustive-deps

  const doPdf = (f: FalhaDoPdf | null) => aoFalhar(f ? { tipo: f.tipo, motivo: f.motivo, onTentar: f.tentar } : null)
  const notacao = textoDaNotacao(dadosDe(content))
  return (
    <Painel rotulo={rotuloDoTipo("Sheet")} testid="painel-partitura">
      {arquivo === "pdf" && url && <PdfViewer url={url} fullscreen titulo={content.title} onFalha={doPdf} />}
      {arquivo === "imagem" && url && !imagemFalhou && (
        <div data-rolagem="painel" className="overflow-x-auto p-espaco-xl">
          <div className="w-fit max-w-full mx-auto border-hairline border-cor-claro-line bg-cor-claro-bg">
            <Image
              key={tentativa}
              src={url}
              alt={rotuloDoTipo("Sheet").toLocaleLowerCase("pt-BR")}
              width={800}
              height={600}
              className="w-full h-auto"
              onError={() => setImagemFalhou(true)}
            />
          </div>
        </div>
      )}
      {(arquivo === "formato" || (arquivo === "imagem" && imagemFalhou)) && <CentroDoPainel />}
      {!arquivo && (notacao
        ? <CorpoMono>{notacao}</CorpoMono>
        : <CentroDoPainel icone frase={FRASES_VIEW["view.vazio.partitura"]} apoio={FRASES_VIEW["view.vazio.partitura.apoio"]} />)}
    </Painel>
  )
}
