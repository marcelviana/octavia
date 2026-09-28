"use client";

/**
 * O visualizador de PDF — compartilhado pela visualização e pelo editor (I1-D27). I1-PR-10: restilizado pela folha
 * `5-content-visualizacao` SEM mudar o que faz (I1-D9): as páginas, o zoom (±0,2 entre 0,5 e 3), *Largura* /
 * *Página* (contêiner ÷ 800 / ÷ 1000), a tela cheia do contêiner, o *Tentar de novo* (nova carga pelo `key`), o
 * reinício quando a `url` muda; a página segue `width 800 × escala` (div. 746).
 *
 * O que muda: traz o PRÓPRIO fundo (`cor-bg` — decisão 3 do aval: no editor velho é um bloco escuro até a PR-11); a
 * barra de texto (`components/content/barra-do-pdf.tsx`) só aparece com o PDF aberto; *carregando o PDF…* sem a URL;
 * o erro na `LinhaDeAviso` com o motivo pela ESPÉCIE (I1-E15 — antes a frase era escolhida pela mensagem e nunca
 * casava, div. 735), sem *Download* e *Refresh Page* (resposta 18). Com `onFalha`, quem desenha a linha é a tela
 * (a folha a põe acima do painel); sem ele (o editor), o próprio visualizador. A tela cheia vem só do
 * `fullscreenchange` (I1-E16): a recusa do navegador deixa de marcar "em tela cheia". A página é o "papel"
 * (`light.bg` + contorno `light.line`) e rola dentro do painel (`data-rolagem="painel"`).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { LinhaDeAviso, type TipoDeAviso } from "@/components/identidade/linha-de-aviso";
import { CentroDoPainel } from "@/components/content/painel";
import { BarraDaTelaCheia, BarraDoPdf, type Ajuste } from "@/components/content/barra-do-pdf";
import { FRASES_VIEW, especieDoPdf, fraseDoPdf, type EspecieDoPdf } from "@/components/content/frases-visualizacao";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// o worker local; na falha, o arquivo de /public (como antes)
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  } catch (error) {
    console.warn("pdf-viewer: worker local indisponível, usando /pdf.worker.min.mjs", error);
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

export interface FalhaDoPdf { tipo: TipoDeAviso; motivo: string; tentar: () => void }

interface PdfViewerProps {
  url: string;
  className?: string;
  fullscreen?: boolean;
  /** o título do content, para a barra da tela cheia (a folha: *{título} · página n de N*) */
  titulo?: string;
  /** a tela desenha a linha da falha (e `null` quando ela passa); sem ele, o visualizador a desenha */
  onFalha?: (falha: FalhaDoPdf | null) => void;
}

export function PdfViewer({ url, className = "", fullscreen = false, titulo, onFalha }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [ajuste, setAjuste] = useState<Ajuste>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [especie, setEspecie] = useState<EspecieDoPdf | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const tentar = useCallback(() => { setRetryCount((n) => n + 1); setEspecie(null); setNumPages(0); }, []);
  const falha: FalhaDoPdf | null = especie ? { tipo: especie === "rede" ? "rede" : "falha", motivo: fraseDoPdf(especie), tentar } : null;
  useEffect(() => { onFalha?.(falha); }, [especie]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLoadSuccess = ({ numPages }: { numPages: number }) => { setNumPages(numPages); setEspecie(null); };
  const onLoadError = (error: Error) => { console.error("pdf-viewer: falha ao abrir o PDF", error); setEspecie(especieDoPdf(error)); };
  const changePage = (offset: number) => setPageNumber((p) => Math.min(Math.max(p + offset, 1), numPages));
  const zoom = (delta: number) => { setAjuste(null); setScale((s) => (delta < 0 ? Math.max(s + delta, 0.5) : Math.min(s + delta, 3))); };
  const fitWidth = () => { if (containerSize.width) { setScale(containerSize.width / 800); setAjuste("largura"); } };
  const fitPage = () => { if (containerSize.height) { setScale(containerSize.height / 1000); setAjuste("pagina"); } };
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  useEffect(() => { setEspecie(null); setRetryCount(0); setPageNumber(1); setNumPages(0); }, [url]);
  useEffect(() => {
    const onFs = () => setIsFullscreen(document.fullscreenElement === containerRef.current && !!containerRef.current);
    const updateSize = () => { if (containerRef.current) setContainerSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight }); };
    updateSize();
    window.addEventListener("resize", updateSize);
    document.addEventListener("fullscreenchange", onFs);
    return () => { window.removeEventListener("resize", updateSize); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  const aberto = numPages > 0 && !especie;
  const pag = { pagina: pageNumber, total: numPages, mudar: changePage };
  return (
    <div ref={containerRef} data-testid="pdf-viewer" className={`w-full flex flex-col bg-cor-bg text-cor-text font-fam-ui font-peso-ui leading-natural ${className}`}>
      {falha && !onFalha && <LinhaDeAviso tipo={falha.tipo} motivo={falha.motivo} acao={{ rotulo: FRASES_VIEW["acao.tentar"], onPress: tentar }} />}
      {aberto && (isFullscreen
        ? <BarraDaTelaCheia {...pag} titulo={titulo} sair={toggleFullscreen} />
        : <BarraDoPdf {...pag} escala={scale} ajuste={ajuste} zoom={zoom} ajustarLargura={fitWidth} ajustarPagina={fitPage} telaCheia={fullscreen ? toggleFullscreen : undefined} />)}
      {/* `mx-auto` no filho, não `justify-center` no pai: com a página mais larga que o painel, o centro do flex a
          empurrava para x negativo e a borda esquerda ficava fora do alcance da rolagem (div. 759) */}
      <div data-rolagem="painel" className={`flex-1 min-h-0 overflow-auto ${aberto ? "p-espaco-xl" : ""}`}>
        <Document
          key={`${url}-${retryCount}`}
          file={url}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={<CentroDoPainel frase={FRASES_VIEW["view.pdf.carregando"]} />}
          error={<CentroDoPainel />}
          className={aberto ? "w-fit mx-auto" : "w-full"}
        >
          <div className="border-hairline border-cor-claro-line bg-cor-claro-bg">
            <Page pageNumber={pageNumber} scale={scale} width={800} />
          </div>
        </Document>
      </div>
    </div>
  );
}

export default PdfViewer;
