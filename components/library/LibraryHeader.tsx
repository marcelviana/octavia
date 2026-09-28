"use client";

/**
 * O cabeçalho da biblioteca (I1-PR-9; folha 4, `LIB`): título *Biblioteca* e, à
 * direita (descem para a linha de baixo quando não cabem, `flex-wrap`), *Filtros*
 * (menu, `LibraryFiltros`), a ordenação (o botão mostra a ordem atual; menu com
 * as três de antes) e *Adicionar* (`/add-content`, o destino de antes). Controles
 * de `touch.list`, contorno `lineInfo`; *Filtros* aberto ganha o contorno `accentInk`.
 */
import React, { memo } from "react";
import { BotaoAdicionar, CONTROLE_LISTA, TituloDaTela } from "@/components/identidade/controles";
import { ItemDoMenu, PainelDoMenu, Seta, useMenu } from "@/components/identidade/menu";
import { FRASES_LISTA } from "@/components/library/frases-lista";
import LibraryFiltros from "@/components/library/LibraryFiltros";
import type { LibraryHeaderProps, SortOption } from "@/types/library";

const ORDENS: readonly SortOption[] = ["recent", "title", "artist"];
const rotuloDaOrdem = (o: SortOption) => FRASES_LISTA[`lib.ordenar.${o}`];

const LibraryHeader = memo<LibraryHeaderProps>(function LibraryHeader({ sortBy, onSortChange, filters, onFiltersChange }) {
  const filtros = useMenu();
  const ordem = useMenu();
  return (
    // I1-E14 (div. 726): o cabeçalho é o contêiner do menu Filtros — âncora pela DIREITA, no máximo a largura dele
    <div className="relative flex flex-wrap items-center justify-between gap-espaco-lg">
      <TituloDaTela>{FRASES_LISTA["lib.titulo"]}</TituloDaTela>
      <div className="flex flex-wrap gap-espaco-lg">
        <div ref={filtros.ref}>
          <button
            type="button"
            aria-expanded={filtros.aberto}
            aria-haspopup="menu"
            onClick={filtros.alternar}
            className={`${CONTROLE_LISTA} gap-espaco-sm ${filtros.aberto ? "border-cor-accent-ink" : "border-cor-line-info"}`}
          >
            {FRASES_LISTA["lib.filtros"]}
            <Seta />
          </button>
          {filtros.aberto && <LibraryFiltros filters={filters} onFiltersChange={onFiltersChange} />}
        </div>
        <div ref={ordem.ref} className="relative">
          <button
            type="button"
            aria-expanded={ordem.aberto}
            aria-haspopup="menu"
            onClick={ordem.alternar}
            className={`${CONTROLE_LISTA} gap-espaco-sm border-cor-line-info`}
          >
            {rotuloDaOrdem(sortBy)}
            <Seta />
          </button>
          {ordem.aberto && (
            <PainelDoMenu className="left-0 mt-espaco-sm py-espaco-sm">
              {ORDENS.map((o) => (
                <ItemDoMenu key={o} onSelect={() => { ordem.fechar(); onSortChange(o); }}>
                  {rotuloDaOrdem(o)}
                </ItemDoMenu>
              ))}
            </PainelDoMenu>
          )}
        </div>
        <BotaoAdicionar rotulo={FRASES_LISTA["lib.adicionar"]} />
      </div>
    </div>
  );
});

export default LibraryHeader;
