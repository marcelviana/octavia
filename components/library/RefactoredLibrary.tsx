"use client";

/**
 * A BIBLIOTECA (I1-PR-9; folha `4-content-lista`: `LIB`, `LIB-filtros`,
 * `LIB-mais`, `LIB-carregando`, `LIB-vazio`, `LIB-vazio-busca`, `LIB-erro`,
 * `LIB-apagar`, `SESSAO-nao-renovada`). O cabeçalho; a linha da tela abaixo dele
 * (uma por tela: a sessão vence; senão a falha da carga sem lista na tela —
 * `lib.erro` com o motivo pelo `status`, decisão 6 do aval); o carregando, o
 * vazio OU a lista (vazio ≠ erro); a paginação; o diálogo de apagar. Os dados, os
 * filtros, a ordem e as ações são os de antes (`useLibraryData`, `useContentActions`).
 */
import React, { memo, useMemo } from "react";
import { useFirebaseAuth } from "@/contexts/firebase-auth-context";
import { useLibraryData } from "@/hooks/use-library-data";
import { useContentActions } from "@/hooks/use-content-actions";
import { DeleteContentDialog } from "@/components/delete-content-dialog";
import { LinhaDaTela } from "@/components/identidade/linha-da-tela";
import { FRASES_LISTA, comDado, especieDaFalha, linhaDaFalha } from "@/components/library/frases-lista";
import type { LibraryProps } from "@/types/library";
import { calculateTotalPages } from "@/lib/library-utils";
import LibraryHeader from "./LibraryHeader";
import LibraryPagination from "./LibraryPagination";
import LibraryEmptyState from "./LibraryEmptyState";
import LibraryLoadingState from "./LibraryLoadingState";
import LibraryErrorBoundary from "./LibraryErrorBoundary";
import OptimizedLibraryList from "./OptimizedLibraryList";

const RefactoredLibrary = memo<LibraryProps>(function RefactoredLibrary({
  onSelectContent,
  initialContent,
  initialTotal,
  initialPage,
  initialSearch,
}) {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const dados = useLibraryData({
    user,
    ready: !authLoading,
    initialContent,
    initialTotal,
    initialPage,
    initialPageSize: 20, // Fixed page size
    initialSearch,
  });
  const { content, totalCount, page, setPage, pageSize, searchQuery, setSearchQuery, sortBy, setSortBy, selectedFilters, setSelectedFilters, loading, erro, reload } = dados;

  const acoesHook = useContentActions(onSelectContent, { onReload: reload });
  const acoes = useMemo(() => ({
    onSelect: acoesHook.selectItem,
    onEdit: acoesHook.editItem,
    onDelete: acoesHook.deleteDialog.open,
    onToggleFavorite: acoesHook.toggleFavoriteItem,
  }), [acoesHook]);

  const vazia = content.length === 0;
  const carregando = loading && vazia;
  const falha = !loading && vazia && erro ? linhaDaFalha(especieDaFalha(erro)) : null;

  return (
    <LibraryErrorBoundary>
      <LibraryHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filters={selectedFilters}
        onFiltersChange={setSelectedFilters}
        onAddContent={() => undefined}
      />
      <LinhaDaTela
        rotuloTentar={FRASES_LISTA["acao.tentar"]}
        falha={falha ? { tipo: falha.tipo, motivo: comDado("lib.erro", { motivo: falha.motivo }), onTentar: falha.tentar ? () => void reload() : undefined } : null}
      />
      {carregando && <LibraryLoadingState />}
      {!loading && vazia && !erro && <LibraryEmptyState searchQuery={searchQuery} filters={selectedFilters} />}
      {!vazia && <OptimizedLibraryList content={content} contentActions={acoes} />}
      <LibraryPagination currentPage={page} totalPages={calculateTotalPages(totalCount, pageSize)} totalCount={totalCount} onPageChange={setPage} />
      <DeleteContentDialog
        open={acoesHook.deleteDialog.isOpen}
        onOpenChange={acoesHook.deleteDialog.close}
        content={acoesHook.deleteDialog.content}
        onConfirm={acoesHook.deleteDialog.confirm}
      />
    </LibraryErrorBoundary>
  );
});

export default RefactoredLibrary;
