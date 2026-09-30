"use client";

/**
 * O formulário de detalhes (I1-PR-12; folha `7-upload`: `UP-detalhes`, `-detalhes-inativo`, `-salvando`,
 * `-salvar-erro`): a linha do arquivo (o ícone do tipo + *{nome} · {tamanho}*), os campos, *Opções avançadas ▾*
 * (fechadas ao abrir, como antes) e *Cancelar* · *Salvar*. O que sobe ao `onComplete` é o de antes
 * (`useMetadataForm`). O que mudou:
 * - sem título ou artista, o *Salvar* inativo diz por quê ao lado (*título e artista são obrigatórios*);
 * - a falha do salvar é a linha da tela, pela espécie, com *o que você escreveu continua aqui* (N2) e *Tentar de novo*
 *   (rede e 5xx), que repete o salvar — antes, a mensagem crua do servidor, em inglês;
 * - os dois cabeçalhos (*Add Metadata*, *Content Details*), o segundo *Back* e o *"Content saved successfully!"* saíram.
 */
import { useState } from "react";
import type { NomeIcone } from "@octavia/identidade";
import { Icone } from "@/components/identidade/icone";
import { LinhaDaTela } from "@/components/identidade/linha-da-tela";
import { BasicMetadataFields } from "./BasicMetadataFields";
import { AdvancedMetadataFields } from "./AdvancedMetadataFields";
import { useMetadataForm } from "@/hooks/useMetadataForm";
import { BotaoDoPasso, Botoes } from "@/components/upload/pecas";
import { linhaDaEscrita } from "@/components/upload/falhas-do-upload";
import { FRASES_UP, linhaDoArquivo } from "@/components/upload/frases-upload";

interface RefactoredMetadataFormProps {
  createdContent?: { title?: string; artist?: string } | null;
  /** o arquivo enviado (a importação): a linha acima dos campos; no criar do zero não há */
  arquivo?: { nome: string; tamanho: number; icone: NomeIcone } | null;
  onComplete: (metadata: Record<string, unknown>) => void | Promise<void>;
  onBack: () => void;
}

export function RefactoredMetadataForm({ createdContent, arquivo, onComplete, onBack }: RefactoredMetadataFormProps) {
  const { formData, isSubmitting, falha, updateField, handleSubmit } = useMetadataForm({
    onComplete,
    initialData: createdContent ? { title: createdContent.title || "", artist: createdContent.artist || "" } : undefined,
  });
  const [avancadas, setAvancadas] = useState(false);
  const falta = !formData.title || !formData.artist;

  return (
    <>
      <LinhaDaTela
        falha={falha ? linhaDaEscrita("up.erro.salvar", falha, () => void handleSubmit(), FRASES_UP["digitado-fica"]) : null}
        rotuloTentar={FRASES_UP["acao.tentar"]}
      />
      {arquivo && (
        <p className="flex items-center gap-espaco-md text-tam-label text-cor-muted break-all">
          <Icone nome={arquivo.icone} tamanho={20} className="text-cor-line-info" />
          {linhaDoArquivo(arquivo.nome, arquivo.tamanho)}
        </p>
      )}
      <BasicMetadataFields title={formData.title} artist={formData.artist} album={formData.album} genre={formData.genre}
        year={formData.year} notes={formData.notes} onChange={updateField} />
      <button type="button" aria-expanded={avancadas} onClick={() => setAvancadas((v) => !v)}
        className="h-toque-min flex items-center gap-espaco-sm text-tam-body-small text-cor-text text-left">
        {FRASES_UP["up.meta.avancadas"]}
        <span aria-hidden className="font-fam-mono font-peso-mono text-tam-label-small text-cor-muted">{avancadas ? "▴" : "▾"}</span>
      </button>
      {avancadas && (
        <AdvancedMetadataFields tom={formData.key} bpm={formData.bpm} difficulty={formData.difficulty} capo={formData.capo}
          tuning={formData.tuning} timeSignature={formData.timeSignature} isFavorite={formData.isFavorite} onChange={updateField} />
      )}
      <Botoes>
        {falta && <p className="text-tam-label text-cor-muted">{FRASES_UP["up.meta.obrigatorios"]}</p>}
        <BotaoDoPasso rotulo={FRASES_UP["acao.cancelar"]} onClick={onBack} inativo={isSubmitting} />
        <BotaoDoPasso rotulo={isSubmitting ? FRASES_UP["up.meta.salvando"] : FRASES_UP["up.meta.salvar"]} icone="garantida" escrita
          inativo={isSubmitting || falta} onClick={() => void handleSubmit()} />
      </Botoes>
    </>
  );
}
