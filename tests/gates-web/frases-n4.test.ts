/**
 * N4-PR3 (div. 977, N4-D14) — o GATE DE IGUALDADE das frases do site que mudaram de casa.
 *
 * A frase que passa do site ao core sai do arquivo que o G-tok lia. O G-tok foi estendido ao módulo do core
 * (`g-tok-arquivos.txt`), e a contagem de strings examinadas não cai — mas o G-tok procura INGLÊS e literal de
 * identidade: tirar uma frase do core ou trocar um caractere dela passa por ele. Este teste fecha as duas:
 *
 *   (1) o site mostra o que mostrava — cada valor exportado por `frases-lista.ts` e `frases-visualizacao.ts`
 *       (resolvido) é IGUAL, byte a byte, ao da linha de base `esperado/frases-n4-site.json`, gerada sobre a
 *       `main` de antes da PR-3 (`scripts/gates-web/frases-n4-base.ts`). Todas as chaves, não só as que mudaram;
 *       chave a mais ou a menos também reprova;
 *   (2) as que mudaram de casa estão no core — para cada linha de `MUDARAM_DE_CASA`, o valor do core é o da base,
 *       e o arquivo do site de onde ela saiu não tem mais o literal (o site IMPORTA; não guarda cópia).
 *
 * Sobre a `main` de antes da PR-3, (2) reprova: o módulo do core não existe.
 */
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import base from "./esperado/frases-n4-site.json"
import { DIFICULDADES, FRASES_LISTA, MESES, TIPOS, tipoDe } from "@/components/library/frases-lista"
import { FRASES_VIEW } from "@/components/content/frases-visualizacao"

type Base = typeof base
const atual: Base = {
  FRASES_LISTA,
  FRASES_VIEW,
  TIPOS,
  DIFICULDADES,
  MESES,
  tipoDe: Object.fromEntries(Object.keys(base.tipoDe).map((t) => [t, tipoDe(t)])) as Base["tipoDe"],
} as unknown as Base

/** As folhas da base, como `caminho → texto` (o que o gate compara, e o tamanho que ele imprime). */
function folhas(o: unknown, prefixo = ""): [string, string][] {
  if (typeof o === "string") return [[prefixo, o]]
  if (o === null || typeof o !== "object") return [[prefixo, JSON.stringify(o)]]
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => folhas(v, prefixo ? `${prefixo} › ${k}` : k))
}

const FOLHAS_DA_BASE = folhas(base)

describe(`(1) o site mostra o que mostrava — ${FOLHAS_DA_BASE.length} folhas da base`, () => {
  it("o mesmo conjunto de caminhos (nenhuma chave a mais, nenhuma a menos)", () => {
    expect(folhas(atual).map(([c]) => c)).toEqual(FOLHAS_DA_BASE.map(([c]) => c))
  })
  const doAtual = new Map(folhas(atual))
  it.each(FOLHAS_DA_BASE)("%s", (caminho, texto) => {
    expect(doAtual.get(caminho)).toBe(texto)
  })
})

/**
 * As frases do site que o tablet vai usar (N4-D14; `N4-PR3-anexos/README.md` §1.2): objeto e chave no site · o
 * arquivo de onde saíram · export e chave no core. O texto vem da BASE, não daqui.
 */
type Linha = readonly [objeto: "FRASES_LISTA" | "FRASES_VIEW" | "TIPOS" | "DIFICULDADES", chave: string, arquivo: string, exportDoCore: string, chaveNoCore: string]
const LISTA = "components/library/frases-lista.ts"
const VIEW = "components/content/frases-visualizacao.ts"
const MUDARAM_DE_CASA: readonly Linha[] = [
  ["FRASES_LISTA", "dash.abas.favoritas", LISTA, "VOCABULARIO_DE_CONTENT", "favoritas"],
  ["FRASES_LISTA", "dash.favoritas", LISTA, "VOCABULARIO_DE_CONTENT", "favoritas"],
  ["FRASES_LISTA", "dash.vazio.favoritas", LISTA, "VOCABULARIO_DE_CONTENT", "vazio-favoritas"],
  ["FRASES_LISTA", "lib.vazio", LISTA, "VOCABULARIO_DE_CONTENT", "vazio-biblioteca"],
  ["FRASES_LISTA", "lib.vazio.busca", LISTA, "VOCABULARIO_DE_CONTENT", "vazio-filtro"],
  ["FRASES_LISTA", "lib.vazio.busca.apoio", LISTA, "VOCABULARIO_DE_CONTENT", "vazio-filtro-apoio"],
  ["FRASES_LISTA", "lib.favoritar.nome", LISTA, "VOCABULARIO_DE_CONTENT", "favoritar-nome"],
  ["FRASES_LISTA", "lib.favorita.nome", LISTA, "VOCABULARIO_DE_CONTENT", "tirar-nome"],
  ["TIPOS", "Lyrics", LISTA, "ROTULO_DO_TIPO", "Lyrics"],
  ["TIPOS", "Chords", LISTA, "ROTULO_DO_TIPO", "Chords"],
  ["TIPOS", "Tab", LISTA, "ROTULO_DO_TIPO", "Tab"],
  ["TIPOS", "Sheet", LISTA, "ROTULO_DO_TIPO", "Sheet"],
  ["DIFICULDADES", "Beginner", LISTA, "ROTULO_DA_DIFICULDADE", "Beginner"],
  ["DIFICULDADES", "Intermediate", LISTA, "ROTULO_DA_DIFICULDADE", "Intermediate"],
  ["DIFICULDADES", "Advanced", LISTA, "ROTULO_DA_DIFICULDADE", "Advanced"],
  ["FRASES_VIEW", "view.voltar", VIEW, "VOCABULARIO_DE_CONTENT", "voltar-biblioteca"],
  ["FRASES_VIEW", "view.detalhes", VIEW, "VOCABULARIO_DE_CONTENT", "detalhes"],
  ["FRASES_VIEW", "view.erro.formato", VIEW, "VOCABULARIO_DE_CONTENT", "erro-formato"],
  ["FRASES_VIEW", "campo.album", VIEW, "VOCABULARIO_DE_CONTENT", "campo-album"],
  ["FRASES_VIEW", "campo.dificuldade", VIEW, "VOCABULARIO_DE_CONTENT", "campo-dificuldade"],
  ["FRASES_VIEW", "campo.genero", VIEW, "VOCABULARIO_DE_CONTENT", "campo-genero"],
  ["FRASES_VIEW", "campo.tom", VIEW, "VOCABULARIO_DE_CONTENT", "campo-tom"],
  ["FRASES_VIEW", "campo.andamento", VIEW, "VOCABULARIO_DE_CONTENT", "campo-andamento"],
  ["FRASES_VIEW", "campo.andamento.bpm", VIEW, "VOCABULARIO_DE_CONTENT", "campo-andamento-bpm"],
  ["FRASES_VIEW", "campo.etiquetas", VIEW, "VOCABULARIO_DE_CONTENT", "campo-etiquetas"],
  ["FRASES_VIEW", "campo.criado", VIEW, "VOCABULARIO_DE_CONTENT", "campo-criado"],
  ["FRASES_VIEW", "campo.alterado", VIEW, "VOCABULARIO_DE_CONTENT", "campo-alterado"],
]

const MODULO_DO_CORE = "@octavia/core/src/frases-content"

function daBase(objeto: Linha[0], chave: string): string {
  if (objeto === "TIPOS") return base.TIPOS.find((t) => t.valor === chave)!.rotulo
  if (objeto === "DIFICULDADES") return base.DIFICULDADES.find((d) => d.valor === chave)!.rotulo
  return (base[objeto] as Record<string, string>)[chave]!
}

describe(`(2) as que mudaram de casa estão no core — ${MUDARAM_DE_CASA.length} linhas`, () => {
  it.each(MUDARAM_DE_CASA)("%s › %s (%s) = core %s › %s", async (objeto, chave, arquivo, exportDoCore, chaveNoCore) => {
    // Resolvido na hora (`@vite-ignore`): sem o módulo, reprova cada linha do (2) e o (1) continua medido.
    const core = (await import(/* @vite-ignore */ MODULO_DO_CORE)) as Record<string, Record<string, string>>
    const texto = daBase(objeto, chave)
    expect(texto, "a linha aponta para uma chave da base").toBeTypeOf("string")
    expect(core[exportDoCore]?.[chaveNoCore]).toBe(texto)
    const fonte = fs.readFileSync(path.resolve(arquivo), "utf8")
    expect(fonte.includes(`"${texto}"`), `${arquivo} ainda guarda o literal "${texto}" — o site importa do core`).toBe(false)
  })
})
