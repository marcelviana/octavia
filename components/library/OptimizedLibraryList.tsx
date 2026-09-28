"use client";

/**
 * A lista da biblioteca (I1-PR-9; folha 4, `LIB`): uma caixa (`radius.control`,
 * contorno `line`) com as linhas; a página rola no documento (sem a área de
 * rolagem de altura fixa de antes). A linha é `LinhaDaBiblioteca`.
 */
import React, { memo } from "react";
import LinhaDaBiblioteca from "@/components/library/LinhaDaBiblioteca";
import type { ContentActions, ContentItem } from "@/types/library";

interface OptimizedLibraryListProps {
  content: ContentItem[];
  contentActions: ContentActions;
}

const OptimizedLibraryList = memo<OptimizedLibraryListProps>(function OptimizedLibraryList({ content, contentActions }) {
  return (
    <div className="border-hairline border-cor-line rounded-raio-control flex flex-col">
      {content.map((item) => (
        <LinhaDaBiblioteca key={item.id} item={item} acoes={contentActions} />
      ))}
    </div>
  );
});

export default OptimizedLibraryList;
