"use client";

/**
 * O vazio da biblioteca (I1-PR-9; folha 4, `LIB-vazio` e `LIB-vazio-busca`): o
 * vazio central (README-design §2.4: `sem conteúdo` 28, `font.display` ·
 * `size.title` · `tracking.display`, apoio `size.body`). De primeira vez, com
 * *Adicionar* — o único controle do vazio, contorno `accentInk`; com busca ou
 * filtro, só as frases. Só aparece quando o servidor respondeu nada — a falha é
 * a `LinhaDeAviso` (`LIB-erro`), nunca este vazio.
 */
import React, { memo } from "react";
import { Icone } from "@/components/identidade/icone";
import { BotaoAdicionar } from "@/components/identidade/controles";
import { FRASES_LISTA } from "@/components/library/frases-lista";
import { hasActiveFilters } from "@/lib/library-utils";
import type { LibraryFilters } from "@/types/library";

export const CENTRO = "py-espaco-xxxl flex flex-col items-center justify-center gap-espaco-lg text-center";
export const FRASE_CENTRAL = "font-fam-display font-peso-display text-tam-title tracking-display uppercase text-cor-text leading-natural";

interface LibraryEmptyStateProps {
  searchQuery: string;
  filters: LibraryFilters;
}

const LibraryEmptyState = memo<LibraryEmptyStateProps>(function LibraryEmptyState({ searchQuery, filters }) {
  const busca = Boolean(searchQuery) || hasActiveFilters(filters);
  return (
    <div className={CENTRO}>
      {!busca && <Icone nome="sem-conteudo" tamanho={28} className="text-cor-line-info" />}
      <p className={FRASE_CENTRAL}>{FRASES_LISTA[busca ? "lib.vazio.busca" : "lib.vazio"]}</p>
      <p className="text-tam-body text-cor-muted">{FRASES_LISTA[busca ? "lib.vazio.busca.apoio" : "lib.vazio.apoio"]}</p>
      {!busca && <BotaoAdicionar rotulo={FRASES_LISTA["lib.adicionar"]} destaque />}
    </div>
  );
});

export default LibraryEmptyState;
