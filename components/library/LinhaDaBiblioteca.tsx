"use client";

/**
 * A linha da biblioteca (I1-PR-9; folha 4, `LIB`/`LIB-mais`; README-design §2.4
 * "linha da biblioteca"): mín. `web.linhaLista` (80), respiro `space.xl`; o ícone
 * do tipo 20 em `lineInfo`, o título `size.body` e o apoio *artista · álbum*
 * `size.label` `muted`; à direita a data (`web.metadado`), *Favoritar* ou *Favorita*
 * (rótulo que alterna, `aria-pressed`, nome acessível longo — frase nova, div.
 * 707) e *Mais* (menu Abrir · Editar · Apagar). As ações descem para a segunda
 * linha quando o bloco do título não cabe (base `web.colunaLateral` = 320, o
 * limiar das linhas flexíveis; aqui pelo nome `web.limiarAviso`, o mesmo 320 em
 * toda faixa). Tom e dificuldade saem da linha (decisão 10 do aval; div. 705).
 * O clique no título abre o content (como antes); o caminho acessível é *Mais → Abrir*.
 */
import React, { memo } from "react";
import { Icone } from "@/components/identidade/icone";
import { ItemDoMenu, PainelDoMenu, Seta, useMenu } from "@/components/identidade/menu";
import { FRASES_LISTA, comDado, dataCurta, tipoDe } from "@/components/library/frases-lista";
import type { ContentActions, ContentItem } from "@/types/library";

const ACAO = "h-toque-min px-espaco-md rounded-raio-control border-hairline flex items-center text-tam-label text-cor-text";

function apoio(item: ContentItem): string {
  return [item.artist || FRASES_LISTA["lib.artista.desconhecido"], item.album].filter(Boolean).join(" · ");
}

const LinhaDaBiblioteca = memo<{ item: ContentItem; acoes: ContentActions }>(function LinhaDaBiblioteca({ item, acoes }) {
  const mais = useMenu();
  const tipo = tipoDe(item.content_type);
  const titulo = { título: item.title };
  return (
    <div className="relative min-h-web-linha-lista flex flex-wrap items-center gap-x-espaco-lg gap-y-espaco-sm py-espaco-md px-espaco-xl border-t-hairline border-cor-line first:border-t-transparent">
      <div className="grow shrink basis-web-limiar-aviso min-w-0 flex items-center gap-espaco-lg cursor-pointer" onClick={() => acoes.onSelect(item)}>
        <Icone nome={tipo.icone} tamanho={20} className="text-cor-line-info" />
        <div className="flex-1 min-w-0 flex flex-col gap-espaco-xs">
          <span className="text-tam-body text-cor-text break-words">{item.title}</span>
          <span className="text-tam-label text-cor-muted">{apoio(item)}</span>
        </div>
      </div>
      <div ref={mais.ref} className="ml-auto shrink-0 flex items-center gap-espaco-sm">
        <span className="text-tam-web-metadado text-cor-muted pr-espaco-sm">{dataCurta(item.created_at)}</span>
        <button
          type="button"
          aria-pressed={item.is_favorite}
          aria-label={comDado(item.is_favorite ? "lib.favorita.nome" : "lib.favoritar.nome", titulo)}
          onClick={() => acoes.onToggleFavorite(item)}
          className={`${ACAO} ${item.is_favorite ? "border-cor-accent-ink bg-cor-marcado" : "border-cor-line-info"}`}
        >
          {FRASES_LISTA[item.is_favorite ? "lib.favorita" : "lib.favoritar"]}
        </button>
        <button
          type="button"
          aria-label={comDado("lib.mais.nome", titulo)}
          aria-haspopup="menu"
          aria-expanded={mais.aberto}
          onClick={mais.alternar}
          className={`${ACAO} gap-espaco-sm border-cor-line-info`}
        >
          {FRASES_LISTA["lib.mais"]}
          <Seta />
        </button>
        {mais.aberto && (
          <PainelDoMenu className="right-espaco-xl py-espaco-sm">
            <ItemDoMenu onSelect={() => { mais.fechar(); acoes.onSelect(item); }}>{FRASES_LISTA["lib.menu.abrir"]}</ItemDoMenu>
            <ItemDoMenu onSelect={() => { mais.fechar(); acoes.onEdit(item); }}>
              <Icone nome="renomear" tamanho={20} className="text-cor-accent-ink" />
              {FRASES_LISTA["lib.menu.editar"]}
            </ItemDoMenu>
            <ItemDoMenu onSelect={() => { mais.fechar(); acoes.onDelete(item); }}>
              <Icone nome="apagar-setlist" tamanho={20} className="text-cor-error-ink" />
              {FRASES_LISTA["lib.menu.apagar"]}
            </ItemDoMenu>
          </PainelDoMenu>
        )}
      </div>
    </div>
  );
});

export default LinhaDaBiblioteca;
