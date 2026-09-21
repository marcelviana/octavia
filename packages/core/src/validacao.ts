/**
 * As TRÊS validações do cliente (N2-D21, T2-R3) e a data-calendário local
 * (T2-R2). Puro: nenhuma request, nenhum relógio implícito — quem chama traz
 * o `Date`.
 *
 * **O cliente valida só o que é dele.** O filtro de texto do servidor
 * (`api-schemas.ts:60-81`, que recusa `data:`, `javascript:`, `vbscript:`,
 * `<script` e `on<palavra>=`) **não é replicado** (div. 181, N2-D21): um nome
 * como `Show — data: 12/10` segue para o servidor e o 400 dele vira a frase
 * `nome-recusado` do conjunto fechado. Replicar o filtro aqui significaria
 * duas implementações de uma regra que o Bloco D vai CONSERTAR, e o cliente
 * ficaria com a versão errada depois do conserto. O limite de 255 caracteres
 * do nome também fica com o servidor, pela mesma razão.
 *
 * As três que são do cliente, e por que cada uma:
 *  (i)   **nome vazio depois de `trim`** — o servidor recusa com `too_small`
 *        (medido, nota N1 do PRD), mas o request custaria uma linha na janela
 *        `setlist-mutate`, que conta ANTES da validação do corpo
 *        (`api-validation-middleware.ts:114-125` < `:151-164`);
 *  (ii)  **data que não existe no calendário** — o servidor NÃO confere:
 *        `2026-02-31` passa pelo Zod (div. 154, medido). Se o cliente não
 *        conferir, ninguém confere;
 *  (iii) **nada mudou → não envia** — um `PUT {}` é válido e bumpa o
 *        `updated_at` (C4), e editar e cancelar não pode invalidar a setlist
 *        no próprio aparelho (T1-R10, T2-R18).
 */
import type { ChaveDeFrase } from './frases'

/** Os metadados que a tela 2 escreve. `description`, `venue` e `notes` ficam com o web. */
export interface CamposSetlist {
  name: string
  /** date-only `YYYY-MM-DD`, ou `null` ("sem data" é estado de primeira classe). */
  performance_date: string | null
}

/** O motivo é também a chave da frase — a folha não tem uma quarta (R1·7c). */
export type MotivoInvalido = Extract<ChaveDeFrase, 'nome-vazio' | 'data-impossivel' | 'nada-mudou'>

export type Validacao<T> = { ok: true; campos: T } | { ok: false; motivo: MotivoInvalido }

/**
 * T2-R2 — `YYYY-MM-DD` montado com ano, mês e dia **locais** do aparelho.
 *
 * **Sem fuso e sem `toISOString()`**, e isso não é preferência: a coluna é
 * `date` (`schema.dump.sql:385`) e um timestamp dá 400 (nota N1 do PRD). O
 * `toISOString()` converte para UTC, e às 23:30 num fuso a oeste ele devolve o
 * DIA SEGUINTE — o show marcado para sábado vira domingo no servidor, e o
 * prefetch de 7 dias (que compara strings de calendário) passa a olhar para a
 * janela errada.
 *
 * É a mesma conta do `hoje()` do `prefetch.ts:40-43`, deliberadamente repetida
 * em vez de importada: o `prefetch.ts` está dentro da cobertura do G1a e
 * unificá-los exigiria declará-lo exceção nesta PR, alargando um escopo que
 * não precisa crescer. A unificação é da PR que tocar o prefetch — e o teste
 * desta função é o que impede as duas de divergirem em silêncio.
 */
export function dataCalendarioLocal(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * T2-R3 (ii) — a data existe no calendário? (div. 154)
 *
 * A checagem é de ida e volta: monta o `Date` com os três números e confere
 * que ele devolve os MESMOS três. É o que pega `2026-02-31` (que o `Date`
 * normaliza para 3 de março) sem uma tabela de meses e sem regra de bissexto
 * escrita à mão. Forma errada — `2026-9-1`, timestamp, vazio — também é
 * "não existe": o cliente não envia o que não sabe montar.
 */
export function dataExiste(bruta: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bruta)
  if (m === null) return false
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(ano, mes - 1, dia)
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia
}

/** O nome como ele vai para o servidor — `trim()`, como o schema faz. */
function nomeLimpo(name: string): string {
  return name.trim()
}

/**
 * T2-R1/T2-R3 — o que o formulário de CRIAR pode enviar.
 *
 * Devolve os campos, nunca o corpo: quem monta o JSON é o `pedidoCriar` do
 * `escrita.ts`, para haver um lugar só onde se decide o que entra no corpo
 * (N2-D20: **sem `songs[]`**).
 */
export function validarCriacao(entrada: CamposSetlist): Validacao<CamposSetlist> {
  const name = nomeLimpo(entrada.name)
  if (name.length === 0) return { ok: false, motivo: 'nome-vazio' }
  if (entrada.performance_date !== null && !dataExiste(entrada.performance_date)) {
    return { ok: false, motivo: 'data-impossivel' }
  }
  return { ok: true, campos: { name, performance_date: entrada.performance_date } }
}

/**
 * T2-R4/T2-R3 (iii) — o que o formulário de EDITAR pode enviar: **só os
 * campos que mudaram** (ausente = não mexe, C4).
 *
 * O web regrava os cinco campos sempre (`setlist-service.ts:187-194`); o
 * nativo não copia, porque isso apagaria em silêncio um `venue`/`notes` que o
 * nativo não exibe.
 *
 * **A ordem dos três motivos é a da folha** (R1·7c): com duas validações
 * abertas vale a do campo mais alto, e o nome está acima da data. "Nada
 * mudou" só se pergunta depois de as duas passarem — um nome apagado não é
 * "nada mudou", é um campo inválido.
 */
export function validarAtualizacao(
  noServidor: CamposSetlist,
  editado: CamposSetlist,
): Validacao<Partial<CamposSetlist>> {
  const name = nomeLimpo(editado.name)
  if (name.length === 0) return { ok: false, motivo: 'nome-vazio' }
  if (editado.performance_date !== null && !dataExiste(editado.performance_date)) {
    return { ok: false, motivo: 'data-impossivel' }
  }
  const campos: Partial<CamposSetlist> = {}
  // O `trim` vem ANTES da comparação: um espaço a mais não é mudança, e
  // enviá-lo bumparia o `updated_at` sem nada mudar de verdade.
  if (name !== nomeLimpo(noServidor.name)) campos.name = name
  if (editado.performance_date !== noServidor.performance_date) {
    campos.performance_date = editado.performance_date
  }
  if (Object.keys(campos).length === 0) return { ok: false, motivo: 'nada-mudou' }
  return { ok: true, campos }
}
