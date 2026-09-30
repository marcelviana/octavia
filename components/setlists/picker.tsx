"use client"

/**
 * O picker de músicas (I1-PR-13; folha `8-setlists`: `SET-adicionar`, `-vazio`, `-busca`, `-enviando`, `-erro`): a
 * busca (`touch.min`, ícone `busca` 20), *Selecionar todas ({n})*, as linhas de `touch.list` (a caixa, o título, o
 * artista em 13 `muted` — sem o tipo, decisão 11), *Cancelar* e *Adicionar {n}*. A busca casa o título, o artista e o
 * tipo — pelo rótulo pt-BR e pelo valor de antes. Vazios: a busca sem resultado; a biblioteca vazia; todas já na
 * setlist (N10 — só quando a biblioteca coube inteira na resposta, decisão 4); e a leitura da biblioteca que falhou
 * (decisão 5: a linha com `lib.erro`, antes o picker dizia "sem músicas").
 */
import { useMemo, useState } from "react"
import { Icone } from "@/components/identidade/icone"
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso"
import { Cancelar, Confirmar, Dialogo } from "@/components/setlists/dialogo"
import { linhaDaFalha } from "@/components/setlists/falhas-das-setlists"
import { FRASES_SET, exibir, fraseSet } from "@/components/setlists/frases-setlists"
import type { Content, SetlistComMusicas } from "@/components/setlists/tipos"

function Caixa({ marcada }: { marcada: boolean }) {
  return marcada
    ? <Icone nome="garantida" tamanho={20} className="text-cor-accent-ink" />
    : <svg aria-hidden width={20} height={20} viewBox="0 0 20 20" className="shrink-0 text-cor-line-info"><rect x="0.5" y="0.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" /></svg>
}

export interface PickerProps {
  setlist: SetlistComMusicas
  biblioteca: readonly Content[]
  bibliotecaInteira: boolean
  erroDaBiblioteca: unknown | null
  onRecarregar: () => void
  selecionadas: readonly string[]
  onSelecionar: (ids: string[]) => void
  enviando: boolean
  erro: unknown | null
  onAdicionar: () => void
  onFechar: () => void
}

export function PickerDeMusicas(p: PickerProps) {
  const [busca, setBusca] = useState("")
  const F = FRASES_SET
  const disponiveis = useMemo(() => {
    const naSetlist = new Set(p.setlist.setlist_songs.map((l) => l.content.id))
    const termo = busca.trim().toLowerCase()
    return p.biblioteca
      .filter((c) => !naSetlist.has(c.id))
      .filter((c) => !termo || [c.title, c.artist, c.content_type, exibir(c).tipo].some((v) => v?.toLowerCase().includes(termo)))
      .sort((a, b) => (a.title || "").localeCompare(b.title || "") || (a.artist || "").localeCompare(b.artist || ""))
  }, [p.biblioteca, p.setlist.setlist_songs, busca])
  const n = p.selecionadas.length
  const todas = disponiveis.length > 0 && n === disponiveis.length
  const alternar = (id: string) => { if (!p.enviando) p.onSelecionar(p.selecionadas.includes(id) ? p.selecionadas.filter((x) => x !== id) : [...p.selecionadas, id]) }
  const alternarTodas = () => { if (!p.enviando) p.onSelecionar(todas ? [] : disponiveis.map((c) => c.id)) }
  const vazio = busca.trim() ? { frase: F["set.picker.busca-vazia"], apoio: F["set.picker.busca-vazia.apoio"] }
    : p.biblioteca.length === 0 ? { frase: F["set.picker.vazio"], apoio: F["set.picker.vazio.apoio"] }
    : p.bibliotecaInteira ? { frase: F["set.picker.todas-ja"], apoio: "" }
    : { frase: F["set.picker.vazio"], apoio: "" }
  const falhaDaBiblioteca = p.erroDaBiblioteca && p.biblioteca.length === 0 ? linhaDaFalha("lib.erro", p.erroDaBiblioteca, { onTentar: p.onRecarregar }) : null
  const nome = n === 0 ? undefined : fraseSet(n === 1 ? "set.picker.ok.nome.uma" : "set.picker.ok.nome", { n, nome: p.setlist.name })
  return (
    <Dialogo
      titulo={fraseSet("set.picker.titulo", { nome: p.setlist.name })}
      onFechar={p.onFechar}
      preso={p.enviando}
      falha={p.erro ? linhaDaFalha("set.erro.adicionar", p.erro, { onTentar: p.onAdicionar }) : null}
      botoes={<>
        <Cancelar onClick={() => { if (!p.enviando) p.onFechar() }} />
        <Confirmar icone="adicionar" nome={nome} inativo={n === 0 || p.enviando} onClick={p.onAdicionar}
          rotulo={p.enviando ? F["set.picker.enviando"] : n === 0 ? F["set.picker.ok.nenhuma"] : fraseSet("set.picker.ok", { n })} />
      </>}
    >
      <div data-testid="picker-busca" className="h-toque-min rounded-raio-control border-hairline border-cor-line-info flex items-center gap-espaco-md px-espaco-lg">
        <Icone nome="busca" tamanho={20} className="text-cor-line-info" />
        <input type="search" data-testid="picker-busca-campo" aria-label={F["set.picker.busca"]} placeholder={F["set.picker.busca"]} value={busca} onChange={(e) => setBusca(e.target.value)}
          className="flex-1 min-w-0 bg-cor-bg text-tam-body text-cor-text leading-natural placeholder:text-cor-muted outline-none" />
      </div>
      {falhaDaBiblioteca ? (
        <LinhaDeAviso tipo={falhaDaBiblioteca.tipo} motivo={falhaDaBiblioteca.motivo}
          acao={falhaDaBiblioteca.onTentar ? { rotulo: F["acao.tentar"], onPress: falhaDaBiblioteca.onTentar } : undefined} />
      ) : disponiveis.length === 0 ? (
        <div className="py-espaco-xxxl flex flex-col items-center justify-center gap-espaco-sm text-center">
          <p className="text-tam-body">{vazio.frase}</p>
          {vazio.apoio && <p className="text-tam-label text-cor-muted">{vazio.apoio}</p>}
        </div>
      ) : (<>
        <div role="checkbox" aria-checked={todas} tabIndex={0} onClick={alternarTodas}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); alternarTodas() } }}
          className="min-h-toque-min flex items-center gap-espaco-md text-tam-body-small cursor-pointer">
          <Caixa marcada={todas} />{fraseSet("set.picker.todas", { n: disponiveis.length })}
        </div>
        <ul className="border-hairline border-cor-line rounded-raio-control flex flex-col">
          {disponiveis.map((c, i) => {
            const marcada = p.selecionadas.includes(c.id), x = exibir(c)
            return (
              <li key={c.id} onClick={() => alternar(c.id)}
                className={`min-h-toque-list flex items-center gap-espaco-md px-espaco-lg border-t-hairline cursor-pointer ${i === 0 ? "border-transparent" : "border-cor-line"}`}>
                <button type="button" role="checkbox" aria-checked={marcada} aria-labelledby={`picker-${c.id}`} onClick={(e) => { e.stopPropagation(); alternar(c.id) }} className="shrink-0 flex">
                  <Caixa marcada={marcada} />
                </button>
                <p id={`picker-${c.id}`} className="flex-1 min-w-0 text-tam-body [overflow-wrap:anywhere]">{x.titulo}</p>
                <p className="text-tam-web-metadado text-cor-muted">{x.artista}</p>
              </li>
            )
          })}
        </ul>
      </>)}
    </Dialogo>
  )
}
