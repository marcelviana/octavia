/**
 * A moldura de `/setlists` (I1-PR-13; folha `8-setlists`, README-design §2.4): a lista e a setlist aberta LADO A LADO na
 * razão `web.razaoListaDetalhe` (2 : 3) em C, vão `space.xl`; em B (e em A, mecânica) a setlist aberta DESCE
 * (`web.empilha`). O cabeçalho da lista (título, contagem, *Nova setlist* de `touch.list` com o `nova setlist` 24 em
 * `accentInk`), a caixa central (carregando, vazio), os três blocos de `web.linhaLista` e o painel sem setlist aberta.
 * Peças sem estado: a rota as usa enquanto o pedaço do gerente carrega (`SET-carregando`).
 */
import type { ReactNode } from "react"
import { ConteudoDaCasca } from "@/components/identidade/casca"
import { CONTROLE_LISTA, TituloDaTela } from "@/components/identidade/controles"
import { Icone } from "@/components/identidade/icone"
import { FRASES_SET } from "@/components/setlists/frases-setlists"

export function Colunas({ lista, painel }: { lista: ReactNode; painel: ReactNode }) {
  return (
    <ConteudoDaCasca>
      <div className="flex flex-wrap items-start gap-espaco-xl">
        <div className="min-w-0 basis-full c:basis-0 c:grow-[var(--faixa-razao-lista)] flex flex-col gap-espaco-lg">{lista}</div>
        <div className="min-w-0 basis-full c:basis-0 c:grow-[var(--faixa-razao-detalhe)] border-hairline border-cor-line rounded-raio-control flex flex-col">
          {painel}
        </div>
      </div>
    </ConteudoDaCasca>
  )
}

interface CabecalhoProps { contagem?: string; onNova?: () => void }

/** Sem `onNova` (a rota ainda sem o gerente — `SET-carregando`) o botão é desenhado e inerte (decisão 15 do aval). */
export function CabecalhoDaLista({ contagem, onNova }: CabecalhoProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-espaco-lg">
      <div className="flex flex-col gap-espaco-xs">
        <TituloDaTela>{FRASES_SET["set.titulo"]}</TituloDaTela>
        {contagem && <p className="text-tam-label text-cor-muted">{contagem}</p>}
      </div>
      <button type="button" aria-disabled={!onNova} onClick={onNova} className={`${CONTROLE_LISTA} border-cor-line-info`}>
        <Icone nome="nova-setlist" tamanho={24} className="text-cor-accent-ink" />
        {FRASES_SET["set.nova"]}
      </button>
    </div>
  )
}

export const FRASE_DA_CAIXA = "font-fam-display font-peso-display text-tam-button tracking-display uppercase leading-natural"

/** A caixa central da coluna da lista: *carregando as setlists…*, o vazio, ou vazia (abaixo da linha do erro). */
export function Caixa({ children }: { children?: ReactNode }) {
  return (
    <div className="border-hairline border-cor-line rounded-raio-control py-espaco-xxxl px-espaco-xl flex flex-col items-center justify-center gap-espaco-lg text-center">
      {children}
    </div>
  )
}

/** Os três blocos sem texto de `SET-carregando-dados` (contorno `line`, sem pulsar). */
export function Blocos() {
  return (
    <div aria-busy="true" className="flex flex-col gap-espaco-md">
      {[0, 1, 2].map((i) => <div key={i} className="h-web-linha-lista border-hairline border-cor-line rounded-raio-control" />)}
    </div>
  )
}

/** O painel sem setlist aberta: a frase (`SET-nenhuma`) ou vazio (carregando, vazio, erro). */
export function PainelSemSetlist({ frase }: { frase?: string }) {
  return (
    <p className="grow flex items-center justify-center py-espaco-xxxl px-espaco-xl text-tam-body text-cor-muted text-center">
      {frase ?? " "}
    </p>
  )
}

/** `SET-carregando`: a sessão, o pedaço do gerente ou o usuário que ainda não chegou — uma frase só, na casca. */
export function SetlistsCarregando() {
  return (
    <Colunas
      lista={<>
        <CabecalhoDaLista />
        <Caixa><p role="status" className={FRASE_DA_CAIXA}>{FRASES_SET["set.carregando"]}</p></Caixa>
      </>}
      painel={<PainelSemSetlist />}
    />
  )
}
