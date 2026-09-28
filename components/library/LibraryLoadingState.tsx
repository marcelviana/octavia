"use client";

/**
 * O carregando da biblioteca (I1-PR-9; folha 4, `LIB-carregando` e
 * `LIB-carregando-chunk`): *carregando a biblioteca…* no vazio central — as duas
 * frases de antes viram uma; o apoio sai (nota da folha).
 */
import React, { memo } from "react";
import { FRASES_LISTA } from "@/components/library/frases-lista";
import { CENTRO, FRASE_CENTRAL } from "@/components/library/LibraryEmptyState";

const LibraryLoadingState = memo(function LibraryLoadingState() {
  return (
    <div role="status" className={CENTRO}>
      <p className={FRASE_CENTRAL}>{FRASES_LISTA["lib.carregando"]}</p>
    </div>
  );
});

export default LibraryLoadingState;
