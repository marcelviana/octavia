"use client"

/**
 * As partes do editor de tab (I1-PR-11; folha 6, `EDIT-tab`; D-0): o bloco *Tablatura* e a *Prévia* (a linha
 * *afinação · capo · BPM*, como a folha). A Tablatura é UM painel de texto (D0-D6, D0-D17): a composição do editor de
 * Letra (o `Bloco`, o `Campo` com rótulo, o campo de várias linhas de `5 × touch.min`, `resize-y`) com a tipografia da
 * tab que o compasso já tinha — mono no `zoom.padrao`, `lineHeight.tab` — e a rolagem horizontal SEM quebra de linha
 * (`wrap="off"`, `white-space: pre`): a quebra é da letra, nunca da tab (N4-D13). Os compassos, as cordas como campos,
 * *Adicionar compasso*, *Duplicar* e *Remover* saíram com o editor de compassos (D0-D7; errata da folha, I1-E33/E34).
 */
import { Bloco, Campo } from "@/components/editors/campos"
import { CaixaDaPrevia, metaDaPrevia } from "@/components/editors/partes-da-cifra"
import { AFINACOES, FRASES_EDIT, rotuloDe } from "@/components/editors/frases-editor"

/** O campo da tab: o contorno do campo de várias linhas (`campos.tsx`, `ENTRADA_ALTA`) com o texto da tab no lugar do corpo. */
const ENTRADA_TAB =
  "w-full rounded-raio-control border-hairline border-cor-line-info bg-cor-bg text-cor-text placeholder:text-cor-muted " +
  "py-espaco-md px-espaco-lg resize-y min-h-campo-letra overflow-x-auto whitespace-pre " +
  "font-fam-mono font-peso-mono text-tam-zoom-padrao leading-entrelinha-tab"

export function TablaturaDaTab({ texto, onMudar }: { texto: string; onMudar: (texto: string) => void }) {
  return (
    <Bloco titulo={FRASES_EDIT["edit.tab.tablatura"]}>
      <Campo rotulo={FRASES_EDIT["edit.tab.tablatura"]} id="tablatura">
        <textarea
          id="tablatura"
          data-testid="campo-tablatura"
          value={texto}
          wrap="off"
          spellCheck={false}
          onChange={(e) => onMudar(e.target.value)}
          className={ENTRADA_TAB}
        />
      </Campo>
    </Bloco>
  )
}

export function PreviaDaTab({ dados }: { dados: { tuning: string; capo: string; bpm: string } }) {
  // só a inicial em minúscula (*padrão (EADGBE)*, a folha): as notas da afinação ficam em maiúscula
  const rotulo = rotuloDe(AFINACOES, dados.tuning)
  const afinacao = rotulo.charAt(0).toLocaleLowerCase("pt-BR") + rotulo.slice(1)
  return (
    <Bloco titulo={FRASES_EDIT["edit.cifra.previa"]}>
      <CaixaDaPrevia texto={metaDaPrevia([["edit.previa.afinacao", afinacao], ["edit.previa.capo", dados.capo], ["edit.previa.bpm", dados.bpm]])} />
    </Bloco>
  )
}
