"use client"

/**
 * As partes do editor de cifra (I1-PR-11; folha 6, `EDIT-cifra`): *Acordes rápidos* (o conjunto de antes — decisão 8;
 * `touch.min` × `touch.min` mín., `font.monoBold` · `size.bodySmall`; inativos sem uma *Progressão* com o foco, como
 * antes), *Seções* (nome · progressão em mono · letra em duas linhas; *Remover seção* quando há mais de uma, como
 * antes) e a *Prévia* (o texto no corpo mono 22 que rola dentro do painel, `data-rolagem="painel"`).
 */
import { BotaoDoBloco, BotaoIcone, Bloco, Campo, ENTRADA, ENTRADA_ALTA, GRADE } from "@/components/editors/campos"
import { ACORDES_RAPIDOS, FRASES_EDIT, fraseEdit } from "@/components/editors/frases-editor"

export interface Secao { id: number; name: string; chords: string; lyrics: string }

export function AcordesRapidos({ ativo, onAcorde }: { ativo: boolean; onAcorde: (acorde: string) => void }) {
  return (
    <Bloco titulo={FRASES_EDIT["edit.cifra.acordes"]}>
      <div className="flex flex-wrap gap-espaco-sm">
        {ACORDES_RAPIDOS.map((a) => (
          <button key={a} type="button" disabled={!ativo} onClick={() => onAcorde(a)}
            className="h-toque-min min-w-toque-min px-espaco-md rounded-raio-control border-hairline border-cor-line-info flex items-center justify-center font-fam-mono-bold font-peso-mono-bold text-tam-body-small text-cor-text disabled:text-cor-muted">
            {a}
          </button>
        ))}
      </div>
    </Bloco>
  )
}

interface SecoesProps {
  secoes: Secao[]
  onAdicionar: () => void
  onRemover: (id: number) => void
  onMudar: (id: number, campo: string, valor: string) => void
  onFoco: (id: number | null) => void
}

export function Secoes({ secoes, onAdicionar, onRemover, onMudar, onFoco }: SecoesProps) {
  return (
    <Bloco titulo={FRASES_EDIT["edit.cifra.secoes"]} acao={<BotaoDoBloco rotulo={FRASES_EDIT["edit.cifra.adicionar-secao"]} onClick={onAdicionar} />}>
      {secoes.map((s, i) => (
        <div key={s.id} className={`${GRADE} ${i > 0 ? "border-t-hairline border-cor-line pt-espaco-lg" : ""}`}>
          <Campo rotulo={FRASES_EDIT["edit.cifra.nome-secao"]} id={`secao-${s.id}-nome`} largo>
            <div className="flex items-center gap-espaco-sm">
              <input id={`secao-${s.id}-nome`} data-testid="campo-secao-nome" value={s.name} placeholder={FRASES_EDIT["edit.cifra.nome-secao.exemplo"]}
                onChange={(e) => onMudar(s.id, "name", e.target.value)} className={ENTRADA} />
              {secoes.length > 1 && <BotaoIcone nome={FRASES_EDIT["edit.cifra.remover-secao"]} icone="remover" onClick={() => onRemover(s.id)} />}
            </div>
          </Campo>
          <Campo rotulo={FRASES_EDIT["edit.cifra.progressao"]} id={`secao-${s.id}-acordes`} largo>
            <input id={`secao-${s.id}-acordes`} data-testid="campo-secao-progressao" value={s.chords} placeholder="Am F C G"
              onChange={(e) => onMudar(s.id, "chords", e.target.value)} onFocus={() => onFoco(s.id)} onBlur={() => onFoco(null)}
              className={`${ENTRADA} font-fam-mono font-peso-mono`} />
          </Campo>
          <Campo rotulo={FRASES_EDIT["edit.cifra.letra-secao"]} id={`secao-${s.id}-letra`} largo>
            <textarea id={`secao-${s.id}-letra`} data-testid="campo-secao-letra" value={s.lyrics}
              onChange={(e) => onMudar(s.id, "lyrics", e.target.value)} className={`${ENTRADA_ALTA} min-h-campo-duas-linhas`} />
          </Campo>
        </div>
      ))}
    </Bloco>
  )
}

/** A linha de cima da prévia: *tom · capo · BPM* do que existe (a forma aprovada, div. 782). */
export function metaDaPrevia(partes: [string, unknown][]): string {
  return partes.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([chave, v]) => fraseEdit(chave as "edit.previa.tom", { x: String(v) })).join(" · ")
}

export function CaixaDaPrevia({ texto }: { texto: string }) {
  return (
    <div data-rolagem="painel" className="overflow-x-auto border-hairline border-cor-line rounded-raio-control p-espaco-lg">
      <div className="font-fam-mono font-peso-mono text-tam-zoom-padrao leading-entrelinha-text whitespace-pre text-cor-text">{texto}</div>
    </div>
  )
}

export function PreviaDaCifra({ dados }: { dados: { key: string; capo: string; bpm: string; sections: Secao[] } }) {
  const meta = metaDaPrevia([["edit.previa.tom", dados.key], ["edit.previa.capo", dados.capo], ["edit.previa.bpm", dados.bpm]])
  const corpo = dados.sections
    .map((s) => [s.name && `[${s.name}]`, s.chords, s.lyrics].filter(Boolean).join("\n"))
    .filter(Boolean)
    .join("\n\n")
  return (
    <Bloco titulo={FRASES_EDIT["edit.cifra.previa"]}>
      {/* a linha de cima, uma linha em branco, as seções (a folha) */}
      <CaixaDaPrevia texto={[meta, corpo].filter(Boolean).join("\n\n")} />
    </Bloco>
  )
}
