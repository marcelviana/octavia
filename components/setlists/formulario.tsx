"use client"

/**
 * O formulário da setlist (I1-PR-13; folha `8-setlists`: `SET-criar`, `-criar-validacao`, `-criar-salvando`,
 * `-criar-erro`; o editar é o MESMO diálogo com *Editar setlist* e *Salvar* — nota de `SET-criar`). Os cinco campos de
 * antes, em `touch.min`: o nome e a descrição na linha inteira, a data (ícone `data`) e o local (ícone `local`) em duas
 * colunas em C e uma em B, as notas. Sem nome, o *Criar* fica inativo e DIZ por quê (N7). Na falha o diálogo FICA, com
 * o que foi digitado (antes fechava como se tivesse dado certo) e a linha com o motivo; *Tentar de novo* reenvia o que
 * está nos campos. *Descrição* e *Notas* seguem `textarea` (decisão 10 do aval: a quebra de linha de um valor não se perde).
 */
import { useState, type FormEvent, type ReactNode } from "react"
import { Icone } from "@/components/identidade/icone"
import type { NomeIcone } from "@octavia/identidade"
import { Cancelar, Confirmar, Dialogo } from "@/components/setlists/dialogo"
import { linhaDaFalha } from "@/components/setlists/falhas-das-setlists"
import { FRASES_SET } from "@/components/setlists/frases-setlists"
import type { FormularioDaSetlist, SetlistComMusicas } from "@/components/setlists/tipos"

const CAIXA = "w-full h-toque-min rounded-raio-control border-hairline border-cor-line-info bg-cor-bg text-tam-body text-cor-text px-espaco-lg"
const ENTRADA = `${CAIXA} leading-natural placeholder:text-cor-muted`
const TEXTO = `${ENTRADA} py-espaco-md resize-y`

function Campo({ id, rotulo, largo = false, children }: { id: string; rotulo: string; largo?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-espaco-sm min-w-0 ${largo ? "col-span-full" : ""}`}>
      <label htmlFor={id} className="text-tam-label text-cor-muted leading-natural">{rotulo}</label>
      {children}
    </div>
  )
}

/** O campo com ícone (a data, o local): a CAIXA leva o contorno e o `data-testid`; o controle dentro dela não tem borda. */
function ComIcone({ testid, icone, children }: { testid: string; icone: NomeIcone; children: ReactNode }) {
  return (
    <div data-testid={testid} className={`${CAIXA} flex items-center gap-espaco-md`}>
      <Icone nome={icone} tamanho={20} className="text-cor-line-info" />
      {children}
    </div>
  )
}
const DENTRO = "flex-1 min-w-0 bg-cor-bg text-tam-body text-cor-text leading-natural placeholder:text-cor-muted outline-none [color-scheme:dark]"

export interface FormularioProps {
  /** a setlist em edição; sem ela, é *Nova setlist* */
  editando: SetlistComMusicas | null
  enviando: boolean
  erro: unknown | null
  onEnviar: (dados: FormularioDaSetlist) => void
  onFechar: () => void
}

export function FormularioDeSetlist({ editando, enviando, erro, onEnviar, onFechar }: FormularioProps) {
  const [d, setD] = useState<FormularioDaSetlist>({
    name: editando?.name ?? "", description: editando?.description ?? "", performance_date: editando?.performance_date ?? "",
    venue: editando?.venue ?? "", notes: editando?.notes ?? "",
  })
  const mudar = (campo: keyof FormularioDaSetlist) => (e: { target: { value: string } }) => setD((a) => ({ ...a, [campo]: e.target.value }))
  const semNome = d.name.trim().length === 0
  const enviar = () => { if (!semNome && !enviando) onEnviar(d) }
  const aoEnviar = (e: FormEvent) => { e.preventDefault(); enviar() }
  const F = FRASES_SET
  const rotulo = enviando ? F[editando ? "set.form.salvando" : "set.form.criando"] : F[editando ? "set.form.salvar" : "set.form.criar"]
  return (
    <form onSubmit={aoEnviar}>
      <Dialogo
        titulo={F[editando ? "set.form.editar" : "set.form.nova"]}
        onFechar={onFechar}
        preso={enviando}
        falha={erro ? linhaDaFalha(editando ? "set.erro.salvar" : "set.erro.criar", erro, { onTentar: enviar, detalhe: F["digitado-fica"] }) : null}
        botoes={<>
          {semNome && <p className="text-tam-label text-cor-muted">{F["set.form.sem-nome"]}</p>}
          <Cancelar onClick={() => { if (!enviando) onFechar() }} />
          <Confirmar envia rotulo={rotulo} icone="garantida" inativo={semNome || enviando} />
        </>}
      >
        <div className="grid grid-cols-1 c:grid-cols-2 gap-espaco-lg">
          <Campo id="setlist-nome" rotulo={F["set.form.nome"]} largo>
            <input id="setlist-nome" data-testid="campo-nome" value={d.name} onChange={mudar("name")} placeholder={F["set.form.nome.exemplo"]} className={ENTRADA} />
          </Campo>
          <Campo id="setlist-descricao" rotulo={F["set.form.descricao"]} largo>
            <textarea id="setlist-descricao" data-testid="campo-descricao" rows={1} value={d.description} onChange={mudar("description")} placeholder={F["set.form.descricao.exemplo"]} className={TEXTO} />
          </Campo>
          <Campo id="setlist-data" rotulo={F["set.form.data"]}>
            <ComIcone testid="campo-data" icone="data">
              <input id="setlist-data" type="date" value={d.performance_date} onChange={mudar("performance_date")} className={DENTRO} />
            </ComIcone>
          </Campo>
          <Campo id="setlist-local" rotulo={F["set.form.local"]}>
            <ComIcone testid="campo-local" icone="local">
              <input id="setlist-local" value={d.venue} onChange={mudar("venue")} placeholder={F["set.form.local.exemplo"]} className={DENTRO} />
            </ComIcone>
          </Campo>
          <Campo id="setlist-notas" rotulo={F["set.form.notas"]} largo>
            <textarea id="setlist-notas" data-testid="campo-notas" rows={1} value={d.notes} onChange={mudar("notes")} placeholder={F["set.form.notas.exemplo"]} className={TEXTO} />
          </Campo>
        </div>
      </Dialogo>
    </form>
  )
}
