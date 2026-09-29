"use client"

/**
 * O bloco *Informações* da cifra e da tab (I1-PR-11; folha 6, `EDIT-cifra`, `EDIT-tab`): Título (a linha toda) ·
 * Artista · Tom (cifra) ou Afinação (tab) · Capo · BPM, na grade de 3 colunas em C e 2 em B. Os valores e o que cada
 * campo muda são os de antes (`chord-editor`/`tab-editor`: o dado vai ao `content_data` — a herança D do §1.2 dos
 * anexos, não tocada).
 */
import { Bloco, Campo, ENTRADA, GRADE, Selecao } from "@/components/editors/campos"
import { AFINACOES, FRASES_EDIT, TONS } from "@/components/editors/frases-editor"

export interface DadosDeInformacoes { title: string; artist: string; key?: string; tuning?: string; capo: string; bpm: string }

export function Informacoes({ dados, onMudar }: { dados: DadosDeInformacoes; onMudar: (campo: keyof DadosDeInformacoes, valor: string) => void }) {
  const texto = (campo: "title" | "artist" | "capo" | "bpm", rotulo: string, testid: string, largo = false, extra: Record<string, string> = {}) => (
    <Campo rotulo={rotulo} id={`info-${campo}`} largo={largo}>
      <input id={`info-${campo}`} data-testid={testid} value={dados[campo]} onChange={(e) => onMudar(campo, e.target.value)} className={ENTRADA} {...extra} />
    </Campo>
  )
  const tab = dados.tuning !== undefined
  return (
    <Bloco titulo={FRASES_EDIT["edit.cifra.informacoes"]}>
      <div className={GRADE}>
        {texto("title", FRASES_EDIT["edit.cifra.titulo"], "campo-info-titulo", true)}
        {texto("artist", FRASES_EDIT["edit.cifra.artista"], "campo-artista")}
        {tab ? (
          <Campo rotulo={FRASES_EDIT["edit.tab.afinacao"]} id="info-tuning">
            <Selecao id="info-tuning" testid="campo-afinacao" valor={dados.tuning ?? ""} opcoes={AFINACOES} escolha={FRASES_EDIT["edit.meta.escolha"]} onMudar={(v) => onMudar("tuning", v)} />
          </Campo>
        ) : (
          <Campo rotulo={FRASES_EDIT["edit.cifra.tom"]} id="info-key">
            <Selecao id="info-key" testid="campo-tom" valor={dados.key ?? ""} opcoes={TONS} escolha={FRASES_EDIT["edit.meta.escolha"]} onMudar={(v) => onMudar("key", v)} />
          </Campo>
        )}
        {texto("capo", FRASES_EDIT["edit.cifra.capo"], "campo-capo", false, { placeholder: FRASES_EDIT["edit.capo.casa"] })}
        {texto("bpm", FRASES_EDIT["edit.cifra.bpm"], "campo-bpm", false, { type: "number", placeholder: "120" })}
      </div>
    </Bloco>
  )
}
