"use client"

/**
 * O cartão da setlist (I1-PR-13; folha `8-setlists`, README-design §2.4 "cartão"): `radius.control`, contorno `line` —
 * a aberta em `accentInk` (`aria-current`); o nome em `font.display` · `size.title` · `tracking.label`, caixa alta
 * (decisão 31: o cartão do S1 nativo); a descrição e os metadados em `size.label` `muted` — o n.º de músicas (ícone 20
 * `lineInfo`), a duração estimada e, quando houver, a data e o local (decisão 7 do aval). *Editar* (`renomear`,
 * `accentInk`) e *Apagar* (`apagar setlist`, `errorInk`): só ícone de 24 num alvo `touch.min`, SEMPRE visíveis (antes
 * só no hover), com o nome acessível longo.
 */
import { memo, type KeyboardEvent } from "react"
import { Icone } from "@/components/identidade/icone"
import { contagemDeMusicas, dataDoShow, duracao, fraseSet } from "@/components/setlists/frases-setlists"
import type { SetlistComMusicas } from "@/components/setlists/tipos"
import type { NomeIcone } from "@octavia/identidade"

/** Um metadado com ícone (20, `lineInfo`): o n.º de músicas, a data, o local. */
export function Metadado({ icone, children }: { icone: NomeIcone; children: string }) {
  return <div className="flex items-center gap-espaco-sm"><Icone nome={icone} tamanho={20} className="text-cor-line-info" />{children}</div>
}

const ALVO = "w-toque-min h-toque-min flex items-center justify-center"

interface Props {
  setlist: SetlistComMusicas
  aberta: boolean
  onAbrir: (s: SetlistComMusicas) => void
  onEditar: (s: SetlistComMusicas) => void
  onApagar: (s: SetlistComMusicas) => void
}

export const CartaoDaSetlist = memo(function CartaoDaSetlist({ setlist, aberta, onAbrir, onEditar, onApagar }: Props) {
  const linhas = setlist.setlist_songs ?? []
  const tempo = duracao(linhas), data = dataDoShow(setlist.performance_date)
  const tecla = (e: KeyboardEvent) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onAbrir(setlist) } }
  return (
    <div role="button" tabIndex={0} aria-current={aberta} onClick={() => onAbrir(setlist)} onKeyDown={tecla}
      className={`border-hairline rounded-raio-control py-espaco-lg pr-espaco-lg pl-espaco-xl flex items-start gap-espaco-lg cursor-pointer ${aberta ? "border-cor-accent-ink" : "border-cor-line"}`}>
      <div className="flex-1 min-w-0 flex flex-col gap-espaco-sm">
        <p className="font-fam-display font-peso-display text-tam-title tracking-label uppercase leading-natural [overflow-wrap:anywhere]">{setlist.name}</p>
        {setlist.description && <p className="text-tam-label text-cor-muted [overflow-wrap:anywhere]">{setlist.description}</p>}
        <div className="flex flex-wrap gap-x-espaco-xl gap-y-espaco-sm text-tam-label text-cor-muted">
          <Metadado icone="n-de-musicas">{contagemDeMusicas(linhas.length)}</Metadado>
          {tempo && <div>{tempo}</div>}
          {data && <Metadado icone="data">{data}</Metadado>}
          {setlist.venue && <Metadado icone="local">{setlist.venue}</Metadado>}
        </div>
      </div>
      <div className="flex gap-espaco-xs shrink-0">
        <button type="button" aria-label={fraseSet("set.editar.nome", { nome: setlist.name })} onClick={(e) => { e.stopPropagation(); onEditar(setlist) }} className={ALVO}>
          <Icone nome="renomear" tamanho={24} className="text-cor-accent-ink" />
        </button>
        <button type="button" aria-label={fraseSet("set.apagar.nome", { nome: setlist.name })} onClick={(e) => { e.stopPropagation(); onApagar(setlist) }} className={ALVO}>
          <Icone nome="apagar-setlist" tamanho={24} className="text-cor-error-ink" />
        </button>
      </div>
    </div>
  )
})
