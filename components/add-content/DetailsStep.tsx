"use client";

/**
 * O passo de detalhes (I1-PR-12; folha `7-upload`): a LEITURA do lote (*carregando…* no lugar da lista — `UP-lote-lendo`,
 * I1-E2, decisão 13 do aval), a prévia do lote (`UP-lote*`) ou o formulário (`UP-detalhes*`). O que cada um grava é o
 * de antes. Os dois cabeçalhos de antes (*Back* + *Add Content Details*) saíram: o título da tela e os passos são de
 * quem chama.
 */
import type { NomeIcone } from "@octavia/identidade";
import { MetadataForm } from "@/components/metadata-form";
import { BatchPreview, type SongItem } from "@/components/batch-preview";
import { ContentType } from "@/types/content";
import type { Database } from "@/types/database.types";
import { BotaoDoPasso, Botoes, Espera } from "@/components/upload/pecas";
import { FRASES_UP } from "@/components/upload/frases-upload";

type Content = Database["public"]["Tables"]["content"]["Row"];

interface DetailsStepProps {
  contentType: ContentType;
  lendo: boolean;
  songs: SongItem[];
  arquivo: { nome: string; tamanho: number; icone: NomeIcone } | null;
  draftContent: { title?: string; artist?: string } | null;
  onBack: () => void;
  onNext: () => void;
  onLoteImportado: (n: number) => void;
  handleSaveContent: (metadata?: Record<string, unknown>) => Promise<unknown>;
  onContentCreated: (content: Content) => void;
}

export function DetailsStep({ contentType, lendo, songs, arquivo, draftContent, onBack, onNext, onLoteImportado, handleSaveContent, onContentCreated }: DetailsStepProps) {
  if (lendo) {
    return (
      <>
        <Espera frase={FRASES_UP["estado.carregando"]} />
        <Botoes>
          <BotaoDoPasso rotulo={FRASES_UP["acao.voltar"]} icone="voltar" onClick={onBack} />
        </Botoes>
      </>
    );
  }
  if (songs.length > 0) {
    return (
      <BatchPreview
        songs={songs}
        contentType={contentType}
        arquivo={arquivo?.nome ?? ""}
        onComplete={(contents) => {
          // o lote grava pela prévia; concluído, a tela volta ao passo 1 com a linha de sucesso (`UP-lote-sucesso`)
          if (contents.length > 0) {
            onLoteImportado(contents.length);
            onNext();
          }
        }}
        onBack={onBack}
      />
    );
  }
  return (
    <MetadataForm
      createdContent={draftContent}
      arquivo={arquivo}
      onComplete={async (metadata) => {
        // O erro PROPAGA de propósito: quem chama (useMetadataForm) mostra a falha ao usuário. Antes, o catch aqui
        // mandava a falha para o console e o wizard avançava assim mesmo — o usuário via "Complete" sobre um save que
        // não aconteceu.
        const savedContent = await handleSaveContent(metadata);
        if (savedContent && typeof savedContent === "object" && "id" in savedContent) {
          onContentCreated(savedContent as Content);
        }
        onNext();
      }}
      onBack={onBack}
    />
  );
}
