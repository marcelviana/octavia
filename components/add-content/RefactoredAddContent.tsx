"use client";

/**
 * O upload (I1-PR-12; folha `7-upload`): o título da tela com os passos e, abaixo, a tela do passo.
 * - passo 1 (*como*): os três seletores, na ORDEM de antes — tipo · como · importar (decisão 3 do aval, I1-E22: trocar
 *   o tipo zera o modo) — e o *Próximo* (decisão 2, I1-E21: a folha põe a zona e o criar numa tela própria, no passo 2;
 *   antes ficavam abaixo dos seletores — um clique a mais, mudança de fluxo declarada). A partitura esconde o *como* e
 *   o lote, como antes (decisão 4);
 * - passo 2 (*detalhes*): a zona de arquivo ou o criar do zero; depois, o formulário ou o lote;
 * - passo 3 (*pronto*).
 * O lote, concluído, volta ao passo 1 com *{n} músicas importadas* na linha da tela (`UP-lote-sucesso` — era um toast).
 * O alerta do passo 1 com a cópia velha do erro de salvar morreu (decisão 24 do DESIGN-I1); o *Back* do passo 1 saiu
 * (decisão 10). O que se envia e o que se grava são os de antes (`useAddContentLogic`).
 */
import { useState } from "react";
import { ContentCreator } from "@/components/content-creator";
import { FileUploadZone } from "./FileUploadZone";
import { StepIndicator } from "./StepIndicatorComponent";
import { CompletionStep } from "./CompletionStep";
import { DetailsStep } from "./DetailsStep";
import { ImportModeSelector } from "./ImportModeSelector";
import { ModeSelector } from "./ModeSelector";
import { ContentTypeSelector } from "./ContentTypeSelector";
import { useAddContentLogic } from "@/hooks/useAddContentLogic";
import { ContentType } from "@/types/content";
import type { Database } from "@/types/database.types";
import { ConteudoDaCasca } from "@/components/identidade/casca";
import { TituloDaTela } from "@/components/identidade/controles";
import { LinhaDaTela } from "@/components/identidade/linha-da-tela";
import { tipoDe } from "@/components/library/frases-lista";
import { BotaoDoPasso, Botoes } from "@/components/upload/pecas";
import { FRASES_UP, musicasImportadas } from "@/components/upload/frases-upload";

type Content = Database["public"]["Tables"]["content"]["Row"];

interface RefactoredAddContentProps {
  onContentCreated: (content: Content) => void;
  onNavigate: (screen: string) => void;
}

export function RefactoredAddContent({ onContentCreated, onNavigate }: RefactoredAddContentProps) {
  const u = useAddContentLogic();
  // I1-PR-12: o passo 1 é só o *como*; `entrou` = o *Próximo* foi dado (a zona ou o criar, já no passo 2 da folha)
  const [entrou, setEntrou] = useState(false);
  const [importadas, setImportadas] = useState<number | null>(null);
  const criado = u.currentStep === 3 && u.createdContent && !Array.isArray(u.createdContent) ? u.createdContent : null;
  const emDetalhes = u.currentStep === 2 || u.isParsing;
  const limpar = <T,>(mudar: (v: T) => void) => (v: T) => { setImportadas(null); mudar(v); };

  let tela: React.ReactNode;
  if (criado) {
    tela = <CompletionStep titulo={criado.title} artista={criado.artist ?? ""} onIrParaABiblioteca={() => onNavigate("library")} />;
  } else if (emDetalhes) {
    tela = (
      <DetailsStep
        contentType={u.contentType}
        lendo={u.isParsing}
        songs={u.parsedSongs}
        arquivo={u.mode === "import" && u.uploadedFile ? { nome: u.uploadedFile.name, tamanho: u.uploadedFile.size, icone: tipoDe(u.contentType).icone } : null}
        draftContent={u.draftContent}
        onBack={() => u.setCurrentStep(1)}
        onNext={() => u.setCurrentStep(3)}
        onLoteImportado={(n) => { setImportadas(n); setEntrou(false); }}
        handleSaveContent={u.handleSaveContent}
        onContentCreated={onContentCreated}
      />
    );
  } else if (!entrou) {
    tela = (
      <>
        <LinhaDaTela falha={importadas ? { tipo: "sucesso", motivo: musicasImportadas(importadas) } : null} rotuloTentar={FRASES_UP["acao.tentar"]} />
        <ContentTypeSelector selectedType={u.contentType} onTypeChange={limpar(u.setContentType)} />
        {u.contentType !== ContentType.SHEET && <ModeSelector selectedMode={u.mode} onModeChange={limpar(u.setMode)} />}
        {u.mode === "import" && <ImportModeSelector selectedImportMode={u.importMode} contentType={u.contentType} onImportModeChange={limpar(u.setImportMode)} />}
        <Botoes>
          <BotaoDoPasso rotulo={FRASES_UP["up.proximo"]} icone="garantida" escrita onClick={() => { setImportadas(null); setEntrou(true); }} />
        </Botoes>
      </>
    );
  } else if (u.mode === "create") {
    tela = (
      <ContentCreator tipo={u.contentType} onVoltar={() => setEntrou(false)}
        onContentCreated={(content) => { u.setDraftContent(content); u.setCurrentStep(2); }} />
    );
  } else {
    tela = (
      <FileUploadZone contentType={u.contentType} onFilesUploaded={u.handleFilesUploaded} onVoltar={() => setEntrou(false)}
        falhaDoLote={u.falhaDoLote} onLerDeNovo={u.lerDeNovo} />
    );
  }

  return (
    <ConteudoDaCasca>
      <div className="flex flex-wrap items-center justify-between gap-espaco-lg">
        <TituloDaTela>{FRASES_UP["up.titulo"]}</TituloDaTela>
        <StepIndicator currentStep={criado ? 3 : emDetalhes || entrou ? 2 : 1} />
      </div>
      {tela}
    </ConteudoDaCasca>
  );
}
