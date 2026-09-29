"use client";

/**
 * O salvar do editor (I1-PR-11; folha 6, `EDIT-salvando`, `EDIT-salvar-erro`; `LIB-salvo` da folha 4). O `PUT` é o de
 * antes (`updateContent` → `PUT /api/content`, o mesmo corpo). O que mudou, decidido no aval:
 * - durante o envio, *Salvando…* e o *Salvar* inativo (decisão 5 — o clique duplo não manda dois `PUT`);
 * - a falha: a linha com o motivo da espécie (o `status` que o erro leva, decisão 3) e *o que você escreveu continua
 *   aqui* (N2); *Tentar de novo* só em rede e 5xx, e repete o MESMO corpo — antes, um toast *"Failed to save changes"*;
 * - o sucesso: o sinal `LIB-salvo` (`lib/sinal-salvo.ts`, decisão 1) e a `/library` de antes — a biblioteca diz
 *   *alterações salvas*; antes, um toast *"Changes saved successfully"* (I1-D26: nenhum toast).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database.types";
import { Casca } from "@/components/identidade/casca";
import { ContentEditor } from "@/components/content-editor";
import type { FalhaDaTela } from "@/components/identidade/linha-da-tela";
import { FRASES_EDIT } from "@/components/editors/frases-editor";
import { especieDoSalvar, linhaDoSalvar } from "@/components/editors/falhas-do-editor";
import { updateContent, clearContentCache } from "@/lib/content-service";
import { marcarSalvo } from "@/lib/sinal-salvo";
import logger from "@/lib/logger";

type Content = Database["public"]["Tables"]["content"]["Row"];

export default function ContentEditPageClient({ content }: { content: Content }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [falha, setFalha] = useState<FalhaDaTela | null>(null);

  const handleSave = async (updatedContent: any) => {
    setSalvando(true);
    setFalha(null);
    try {
      await updateContent(content.id, updatedContent);
      clearContentCache();
      marcarSalvo();
      router.push("/library");
    } catch (err) {
      logger.error("Editor: falha ao salvar", err);
      const linha = linhaDoSalvar(especieDoSalvar(err));
      setFalha({
        tipo: linha.tipo,
        motivo: linha.motivo,
        detalhe: FRASES_EDIT["digitado-fica"],
        onTentar: linha.tentar ? () => void handleSave(updatedContent) : undefined,
      });
      setSalvando(false);
    }
  };

  return (
    <Casca>
      <ContentEditor content={content} onSave={handleSave} onCancel={() => router.back()} salvando={salvando} falhaAoSalvar={falha} />
    </Casca>
  );
}
