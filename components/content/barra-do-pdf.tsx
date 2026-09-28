"use client"

/**
 * As barras do visualizador de PDF (I1-PR-10; folha 5, `VIEW-partitura` e `VIEW-partitura-cheia`, README-design
 * §2.4 "barra do PDF" e "tela cheia"). Os controles são os de antes, com rótulo curto e nome acessível longo:
 * *Anterior* (o `voltar` 20) · *página n de N* · *Próxima* (o voltar espelhado, resposta 11) · zoom −/+ (24, nomes
 * *Diminuir/Aumentar o zoom*) · a escala · *Largura* / *Página* (o último ajuste escolhido fica marcado: contorno
 * `accentInk` + 12 %) · *Tela cheia*. Controles `touch.min`; a barra quebra linha quando não cabe (em B, duas).
 *
 * Na tela cheia (I1-E16): a barra da folha — *{título} · página n de N* e *Sair da tela cheia* (o `fechar` 24) — MAIS
 * *Anterior* e *Próxima*: a paginação fica na tela cheia (I1-D27).
 */
import { Icone } from "@/components/identidade/icone"
import { FRASES_VIEW, fraseCom } from "@/components/content/frases-visualizacao"

export type Ajuste = "largura" | "pagina" | null

const CONTROLE = "h-toque-min rounded-raio-control border-hairline flex items-center text-tam-label"
const COM_CONTORNO = `${CONTROLE} border-cor-line-info`

interface Paginacao { pagina: number; total: number; mudar: (delta: number) => void }

function Paginas({ pagina, total, mudar, comTexto = true }: Paginacao & { comTexto?: boolean }) {
  const primeira = pagina <= 1, ultima = pagina >= total
  return (
    <>
      <button type="button" onClick={() => mudar(-1)} disabled={primeira} className={`${COM_CONTORNO} gap-espaco-sm px-espaco-md ${primeira ? "text-cor-muted" : "text-cor-text"}`}>
        <Icone nome="voltar" tamanho={20} className={primeira ? "text-cor-line-info" : ""} />
        {FRASES_VIEW["view.pdf.anterior"]}
      </button>
      {comTexto && <span className="text-tam-label text-cor-text px-espaco-sm">{fraseCom("view.pdf.pagina", { n: String(pagina), N: String(total) })}</span>}
      <button type="button" onClick={() => mudar(1)} disabled={ultima} className={`${COM_CONTORNO} gap-espaco-sm px-espaco-md ${ultima ? "text-cor-muted" : "text-cor-text"}`}>
        {FRASES_VIEW["view.pdf.proxima"]}
        <Icone nome="voltar" tamanho={20} className={`-scale-x-100 ${ultima ? "text-cor-line-info" : ""}`} />
      </button>
    </>
  )
}

export interface BarraDoPdfProps extends Paginacao {
  escala: number
  ajuste: Ajuste
  zoom: (delta: number) => void
  ajustarLargura: () => void
  ajustarPagina: () => void
  telaCheia?: () => void
}

export function BarraDoPdf({ escala, ajuste, zoom, ajustarLargura, ajustarPagina, telaCheia, ...pag }: BarraDoPdfProps) {
  const marcado = (a: Ajuste) => (ajuste === a ? "border-cor-accent-ink bg-cor-marcado" : "border-cor-line-info")
  return (
    <div className="flex flex-wrap items-center gap-espaco-sm py-espaco-sm px-espaco-lg border-b-hairline border-cor-line">
      <Paginas {...pag} />
      <div className="flex-1" />
      <button type="button" aria-label={FRASES_VIEW["view.pdf.zoom.menos"]} onClick={() => zoom(-0.2)} className={`${COM_CONTORNO} w-toque-min justify-center`}>
        <Icone nome="zoom-menos" tamanho={24} />
      </button>
      <span className="w-toque-min text-center font-fam-mono font-peso-mono text-tam-label">{`${Math.round(escala * 100)}%`}</span>
      <button type="button" aria-label={FRASES_VIEW["view.pdf.zoom.mais"]} onClick={() => zoom(0.2)} className={`${COM_CONTORNO} w-toque-min justify-center`}>
        <Icone nome="zoom-mais" tamanho={24} />
      </button>
      <button type="button" aria-label={FRASES_VIEW["view.pdf.largura.nome"]} onClick={ajustarLargura} className={`${CONTROLE} px-espaco-md ${marcado("largura")}`}>
        {FRASES_VIEW["view.pdf.largura"]}
      </button>
      <button type="button" aria-label={FRASES_VIEW["view.pdf.pagina.nome"]} onClick={ajustarPagina} className={`${CONTROLE} px-espaco-md ${marcado("pagina")}`}>
        {FRASES_VIEW["view.pdf.pagina.ajuste"]}
      </button>
      {telaCheia && (
        <button type="button" onClick={telaCheia} className={`${COM_CONTORNO} px-espaco-md`}>
          {FRASES_VIEW["view.pdf.tela-cheia"]}
        </button>
      )}
    </div>
  )
}

export function BarraDaTelaCheia({ titulo, sair, ...pag }: Paginacao & { titulo?: string; sair: () => void }) {
  const pagina = fraseCom("view.pdf.pagina", { n: String(pag.pagina), N: String(pag.total) })
  return (
    <div className="min-h-barra-top flex flex-wrap items-center gap-espaco-sm px-web-margem border-b-hairline border-cor-line">
      <p className="flex-1 min-w-0 text-tam-body-small text-cor-text">{titulo ? `${titulo} · ${pagina}` : pagina}</p>
      <Paginas {...pag} comTexto={false} />
      <button type="button" onClick={sair} className="h-toque-min rounded-raio-control border-hairline border-cor-line-info flex items-center gap-espaco-md px-espaco-lg text-tam-body-small text-cor-text">
        <Icone nome="fechar" tamanho={24} />
        {FRASES_VIEW["view.pdf.sair"]}
      </button>
    </div>
  )
}
