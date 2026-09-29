"use client"

/**
 * As partes do editor de tab (I1-PR-11; folha 6, `EDIT-tab`; decisão 7): o bloco *Tablatura* (com *Adicionar
 * compasso*), o COMPASSO num painel como a folha (contorno `line`, `radius.control`, mono 22, `lineHeight.tab`,
 * `data-rolagem="painel"`: a corda longa rola dentro dele) com as seis cordas editáveis sem contorno próprio, e a
 * *Prévia* (a linha *afinação · capo · BPM*, como a folha).
 */
import { BotaoDoBloco, BotaoIcone, Bloco } from "@/components/editors/campos"
import { CaixaDaPrevia, metaDaPrevia } from "@/components/editors/partes-da-cifra"
import { AFINACOES, FRASES_EDIT, fraseEdit, rotuloDe } from "@/components/editors/frases-editor"

export function TablaturaDaTab({ onAdicionar, children }: { onAdicionar: () => void; children: React.ReactNode }) {
  return (
    <Bloco titulo={FRASES_EDIT["edit.tab.tablatura"]} acao={<BotaoDoBloco rotulo={FRASES_EDIT["edit.tab.adicionar-compasso"]} onClick={onAdicionar} />}>
      {children}
    </Bloco>
  )
}

interface CompassoProps {
  numero: number
  cordas: string[]
  podeRemover: boolean
  onCorda: (indice: number, valor: string) => void
  onDuplicar: () => void
  onRemover: () => void
}

const MONO_TAB = "font-fam-mono font-peso-mono text-tam-zoom-padrao leading-entrelinha-tab text-cor-text"

export function CompassoDaTab({ numero, cordas, podeRemover, onCorda, onDuplicar, onRemover }: CompassoProps) {
  return (
    <div className="border-hairline border-cor-line rounded-raio-control flex flex-col">
      <div className="flex items-center justify-between gap-espaco-sm pl-espaco-lg">
        <p className={MONO_TAB}>{fraseEdit("edit.tab.compasso", { n: String(numero) })}</p>
        <div className="flex">
          <BotaoIcone nome={FRASES_EDIT["edit.tab.duplicar-compasso"]} icone="adicionar" onClick={onDuplicar} />
          {podeRemover && <BotaoIcone nome={FRASES_EDIT["edit.tab.remover-compasso"]} icone="remover" onClick={onRemover} />}
        </div>
      </div>
      <div data-rolagem="painel" className="overflow-x-auto px-espaco-lg pb-espaco-lg flex flex-col">
        {cordas.map((corda, i) => (
          <input
            key={i}
            value={corda}
            size={Math.max(corda.length, 1)}
            aria-label={fraseEdit("edit.tab.corda", { n: String(i + 1), m: String(numero) })}
            onChange={(e) => onCorda(i, e.target.value)}
            className={`${MONO_TAB} self-start bg-cor-bg border-0 p-0`}
          />
        ))}
      </div>
    </div>
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
