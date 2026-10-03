/**
 * N4-PR3 (N4-D16) — a igualdade de tipos entre a linha de aviso do site e o contrato do core, cobrada pelo `tsc`.
 * O `tsconfig.json` da raiz exclui `tests/`, e o type-check dos testes no CI é informativo; por isso o `tsc` roda
 * aqui, como subprocesso (o molde do `apps/native/test/gates.test.ts`), sobre `contrato/linha-de-aviso.tipos.ts`.
 */
import { execFileSync } from "node:child_process"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("a linha de aviso do site e o contrato do core", () => {
  it("o tsc compila a igualdade de tipos (espécies, ação, motivo)", () => {
    const tsc = path.resolve("node_modules/.bin/tsc")
    const projeto = path.resolve("tests/gates-web/contrato/tsconfig.json")
    let saida = ""
    let codigo = 0
    try {
      saida = execFileSync(tsc, ["--noEmit", "-p", projeto, "--listFilesOnly"], { encoding: "utf8" })
      execFileSync(tsc, ["--noEmit", "-p", projeto], { encoding: "utf8" })
    } catch (e) {
      codigo = (e as { status?: number }).status ?? 1
      saida = String((e as { stdout?: string }).stdout ?? e)
    }
    expect(saida, "o tsc leu o arquivo da igualdade").toContain("linha-de-aviso.tipos.ts")
    expect(codigo, saida).toBe(0)
  }, 120_000)
})
