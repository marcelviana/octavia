"use client"

/**
 * A tab (I1-PR-10; folha 5, `VIEW-tab` / `VIEW-vazio-tab`): o painel *Tab* com o corpo mono 22 em
 * `lineHeight.tab`, rolando dentro do painel, e *capo* · *afinação* sob a tab, como antes (`view.tab.meta`). Sem
 * tablatura, o vazio honesto (N4) no lugar da tablatura-fixture de antes, sem a linha de capo.
 *
 * Os acordes da tab vão num segundo painel *Cifra* (decisão 10; I1-E18). Decisão 11 (div. 743): antes, `chords` em
 * TEXTO derrubava a página (`chords.map` sem `Array.isArray`); agora vai ao painel como texto — mudança de
 * comportamento declarada, com teste (`components/content/__tests__/visualizacao-estados.test.tsx`).
 */
import { CentroDoPainel, CorpoMono, Painel } from "@/components/content/painel"
import { textoDaTab, textoDosAcordes } from "@/components/content/corpo-de-texto"
import { FRASES_VIEW, capoDe, fraseCom, rotuloDoTipo } from "@/components/content/frases-visualizacao"
import { dadosDe, type ConteudoVisto } from "@/components/content/tipos"

export function TabDisplay({ content }: { content: ConteudoVisto }) {
  const dados = dadosDe(content)
  const tab = textoDaTab(dados)
  const acordes = textoDosAcordes(dados?.chords)
  return (
    <>
      <Painel rotulo={rotuloDoTipo("Tab")} testid="painel-tab">
        {tab ? (
          <>
            <CorpoMono tab>{tab}</CorpoMono>
            <div className="flex flex-wrap gap-x-espaco-xxl px-espaco-xl pb-espaco-xl text-tam-label text-cor-muted">
              <p>{fraseCom("view.tab.capo", { x: capoDe(content.capo) })}</p>
              <p>{fraseCom("view.tab.afinacao", { x: content.tuning || FRASES_VIEW["view.tab.afinacao.padrao"] })}</p>
            </div>
          </>
        ) : (
          <CentroDoPainel icone frase={FRASES_VIEW["view.vazio.tab"]} />
        )}
      </Painel>
      {acordes && (
        <Painel rotulo={rotuloDoTipo("Chords")} testid="painel-cifra">
          <CorpoMono>{acordes}</CorpoMono>
        </Painel>
      )}
    </>
  )
}
