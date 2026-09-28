"use client";

/**
 * O menu *Filtros* da biblioteca (I1-PR-9; folha 4, `LIB-filtros`): o conteúdo de
 * antes — tipo (os quatro, com o ícone de 20 do catálogo), dificuldade e *Só as
 * favoritas* —, numa caixa abaixo do controle (vão `space.sm`, respiro
 * `space.xl`, vão interno `space.lg`); cada opção é um alternável `touch.min`. Os
 * mesmos valores de filtro de antes (o enum de `types/content.ts`, `Beginner`…).
 * I1-E14 (div. 726): a caixa ancora pela DIREITA do cabeçalho e não passa da largura dele (`max-w-full`);
 * em A os alternáveis quebram linha. A folha a desenhou à esquerda, passando da moldura.
 */
import React from "react";
import { Icone } from "@/components/identidade/icone";
import { alternavel } from "@/components/identidade/controles";
import { PainelDoMenu } from "@/components/identidade/menu";
import { DIFICULDADES, FRASES_LISTA, TIPOS } from "@/components/library/frases-lista";
import type { LibraryFilters } from "@/types/library";

const ROTULO = "font-fam-mono font-peso-mono text-tam-label-small tracking-label uppercase text-cor-muted";

function alternar(lista: string[], valor: string): string[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

export default function LibraryFiltros({ filters, onFiltersChange }: { filters: LibraryFilters; onFiltersChange: (f: LibraryFilters) => void }) {
  return (
    <PainelDoMenu rotulo={FRASES_LISTA["lib.filtros"]} className="right-0 max-w-full mt-espaco-sm p-espaco-xl flex flex-col gap-espaco-lg">
      <span className={ROTULO}>{FRASES_LISTA["lib.filtros.tipo"]}</span>
      <div className="flex flex-wrap gap-espaco-sm">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            aria-pressed={filters.contentType.includes(t.valor)}
            onClick={() => onFiltersChange({ ...filters, contentType: alternar(filters.contentType, t.valor) })}
            className={alternavel(filters.contentType.includes(t.valor), "gap-espaco-sm px-espaco-md")}
          >
            <Icone nome={t.icone} tamanho={20} />
            {t.rotulo}
          </button>
        ))}
      </div>
      <span className={ROTULO}>{FRASES_LISTA["lib.filtros.dificuldade"]}</span>
      <div className="flex flex-wrap gap-espaco-sm">
        {DIFICULDADES.map((d) => (
          <button
            key={d.valor}
            type="button"
            aria-pressed={filters.difficulty.includes(d.valor)}
            onClick={() => onFiltersChange({ ...filters, difficulty: alternar(filters.difficulty, d.valor) })}
            className={alternavel(filters.difficulty.includes(d.valor), "px-espaco-md")}
          >
            {d.rotulo}
          </button>
        ))}
      </div>
      <label className="h-toque-min flex items-center gap-espaco-md text-tam-body-small text-cor-text">
        <input
          type="checkbox"
          data-testid="lib-so-favoritas"
          checked={filters.favorite}
          onChange={(e) => onFiltersChange({ ...filters, favorite: e.target.checked })}
          className="w-espaco-lg h-espaco-lg accent-cor-accent"
        />
        {FRASES_LISTA["lib.filtros.favoritas"]}
      </label>
    </PainelDoMenu>
  );
}
