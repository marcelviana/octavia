"use client"

/**
 * A setlist aberta (I1-PR-13; folha `8-setlists`: `SET`, `SET-sem-musicas`, `SET-remover-erro`). O cabeçalho (o nome em
 * `font.display` · `size.title` · `tracking.display`; a descrição; *{n} músicas · {duração}*; a data e o local quando
 * houver; *Editar* e *Adicionar músicas* de `touch.list` — em B o rótulo curto *Adicionar* com o rótulo de C como nome
 * acessível, N3-D17); a `LinhaDeAviso` do remover logo abaixo dele; as linhas de música de `web.linhaMusica` — na ordem da
 * setlist, SEM alça (decisão 27: a ordem é fixa) — com o número em mono, o título, o artista, a nota (13 `muted`), o
 * tipo e o *remover* sempre visível. A linha entrega a LINHA ao remover, não o content (o defeito (a) do N2 §10.3.5).
 */
import { memo } from "react"
import { CONTROLE_LISTA } from "@/components/identidade/controles"
import { Icone } from "@/components/identidade/icone"
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso"
import type { FalhaDaTela } from "@/components/identidade/linha-da-tela"
import { Metadado } from "@/components/setlists/cartao"
import { FRASES_SET, contagemDeMusicas, dataDoShow, duracao, exibir, fraseSet } from "@/components/setlists/frases-setlists"
import type { LinhaDaSetlist, SetlistComMusicas } from "@/components/setlists/tipos"

interface Props {
  setlist: SetlistComMusicas
  falha: FalhaDaTela | null
  onEditar: () => void
  onAdicionar: () => void
  onRemover: (linha: LinhaDaSetlist) => void
}

const META = "text-tam-web-metadado text-cor-muted"

export const SetlistAberta = memo(function SetlistAberta({ setlist, falha, onEditar, onAdicionar, onRemover }: Props) {
  const linhas = [...(setlist.setlist_songs ?? [])].sort((a, b) => a.position - b.position)
  const tempo = duracao(linhas), data = dataDoShow(setlist.performance_date)
  const F = FRASES_SET
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-espaco-lg p-espaco-xl border-b-hairline border-cor-line">
        <div className="grow shrink basis-web-limiar-aviso min-w-0 flex flex-col gap-espaco-xs">
          <h2 className="font-fam-display font-peso-display text-tam-title tracking-display uppercase leading-natural [overflow-wrap:anywhere]">{setlist.name}</h2>
          {setlist.description && <p className="text-tam-label text-cor-muted [overflow-wrap:anywhere]">{setlist.description}</p>}
          <p className="text-tam-label text-cor-muted">{tempo ? `${contagemDeMusicas(linhas.length)} · ${tempo}` : contagemDeMusicas(linhas.length)}</p>
          {(data || setlist.venue) && (
            <div className="flex flex-wrap gap-x-espaco-xl gap-y-espaco-sm text-tam-label text-cor-muted">
              {data && <Metadado icone="data">{data}</Metadado>}
              {setlist.venue && <Metadado icone="local">{setlist.venue}</Metadado>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-espaco-lg">
          <button type="button" onClick={onEditar} className={`${CONTROLE_LISTA} border-cor-line-info`}>
            <Icone nome="renomear" tamanho={24} className="text-cor-accent-ink" />{F["set.editar"]}
          </button>
          {/* C: o rótulo inteiro e o nome longo. B e A: o rótulo curto com o rótulo de C como nome acessível (N3-D17 — é o
              que o G-faixa conta como saída "nome-acessível" e não como texto que sumiu) */}
          <button type="button" aria-label={fraseSet("set.adicionar.nome", { nome: setlist.name })} onClick={onAdicionar} className={`${CONTROLE_LISTA} border-cor-line-info hidden c:flex`}>
            <Icone nome="adicionar" tamanho={24} className="text-cor-accent-ink" />{F["set.adicionar"]}
          </button>
          <button type="button" aria-label={F["set.adicionar"]} onClick={onAdicionar} className={`${CONTROLE_LISTA} border-cor-line-info c:hidden`}>
            <Icone nome="adicionar" tamanho={24} className="text-cor-accent-ink" />{F["set.adicionar.curto"]}
          </button>
        </div>
      </div>
      {falha && (
        <LinhaDeAviso tipo={falha.tipo} motivo={falha.motivo} acao={falha.onTentar ? { rotulo: F["acao.tentar"], onPress: falha.onTentar } : undefined} />
      )}
      {linhas.length === 0 ? (
        <div className="grow flex flex-col items-center justify-center gap-espaco-md py-espaco-xxxl px-espaco-xl text-center">
          <p className="text-tam-body">{F["set.sem-musicas"]}</p>
          <p className="text-tam-label text-cor-muted">{F["set.sem-musicas.apoio"]}</p>
        </div>
      ) : (
        <ol>
          {linhas.map((linha, i) => {
            const x = exibir(linha.content)
            return (
              <li key={linha.id} className={`min-h-web-linha-musica flex items-center gap-espaco-lg pr-espaco-md pl-espaco-xl border-t-hairline ${i === 0 ? "border-transparent" : "border-cor-line"}`}>
                <p className="w-espaco-xl shrink-0 font-fam-mono font-peso-mono text-tam-label text-cor-muted">{i + 1}</p>
                <div className="flex-1 min-w-0 flex flex-col gap-espaco-xs">
                  <p className="text-tam-body [overflow-wrap:anywhere]">{x.titulo}</p>
                  <p className={META}>{x.artista}</p>
                  {linha.notes && <p className={`${META} [overflow-wrap:anywhere]`}>{linha.notes}</p>}
                </div>
                {x.tipo && <p className={`${META} shrink-0`}>{x.tipo}</p>}
                <button type="button" aria-label={fraseSet("set.remover", { título: x.titulo })} onClick={() => onRemover(linha)} className="w-toque-min h-toque-min shrink-0 flex items-center justify-center">
                  <Icone nome="remover" tamanho={24} className="text-cor-accent-ink" />
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
})
