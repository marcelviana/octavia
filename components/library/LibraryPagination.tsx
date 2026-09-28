"use client";

/**
 * A paginação (I1-PR-9; folha 4, `LIB`; README-design §2.4 "paginação"):
 * *Anterior* (o `voltar` 20) · as páginas (`touch.min`; a atual marcada) ·
 * *Próxima* (o voltar espelhado — resposta 11 da folha). O inativo fica em
 * `muted`/`lineInfo`. Some com ≤ 1 página, como antes.
 */
import React, { memo } from "react";
import { Icone } from "@/components/identidade/icone";
import { alternavel } from "@/components/identidade/controles";
import { FRASES_LISTA } from "@/components/library/frases-lista";
import { generatePaginationRange } from "@/lib/library-utils";
import type { LibraryPaginationProps } from "@/types/library";

const PASSO = "h-toque-min px-espaco-md rounded-raio-control border-hairline border-cor-line-info flex items-center gap-espaco-sm text-tam-body-small text-cor-text disabled:text-cor-muted";

const LibraryPagination = memo<LibraryPaginationProps>(function LibraryPagination({ currentPage, totalPages, totalCount, onPageChange }) {
  if (totalCount === 0 || totalPages <= 1) return null;
  const primeira = currentPage === 1;
  const ultima = currentPage === totalPages;
  return (
    <nav className="flex flex-wrap justify-center gap-espaco-sm">
      <button type="button" disabled={primeira} onClick={() => onPageChange(currentPage - 1)} className={PASSO}>
        <Icone nome="voltar" tamanho={20} className={primeira ? "text-cor-line-info" : ""} />
        {FRASES_LISTA["lib.paginas.anterior"]}
      </button>
      {generatePaginationRange(currentPage, totalPages).map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === currentPage ? "page" : undefined}
          onClick={() => onPageChange(n)}
          className={alternavel(n === currentPage, "w-toque-min justify-center text-cor-text")}
        >
          {n}
        </button>
      ))}
      <button type="button" disabled={ultima} onClick={() => onPageChange(currentPage + 1)} className={PASSO}>
        {FRASES_LISTA["lib.paginas.proxima"]}
        <Icone nome="voltar" tamanho={20} className={`-scale-x-100 ${ultima ? "text-cor-line-info" : ""}`} />
      </button>
    </nav>
  );
});

export default LibraryPagination;
