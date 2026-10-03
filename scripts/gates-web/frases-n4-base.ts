// N4-PR3 (div. 977) — a LINHA DE BASE das frases do site que o N4 toca: o que `frases-lista.ts` e
// `frases-visualizacao.ts` exportam, resolvido (as referências entre os dois já seguidas), em JSON.
// Gerada UMA vez, sobre a `main` de antes da PR-3 (`0a37342`), e commitada em
// `tests/gates-web/esperado/frases-n4-site.json`; o `tests/gates-web/frases-n4.test.ts` compara o site de agora
// com ela, frase a frase. Regerar a base é mudar o que o gate afirma: só com declaração.
// Uso (da raiz):  pnpm exec tsx scripts/gates-web/frases-n4-base.ts > tests/gates-web/esperado/frases-n4-site.json
import { DIFICULDADES, FRASES_LISTA, MESES, TIPOS, tipoDe } from "@/components/library/frases-lista"
import { FRASES_VIEW } from "@/components/content/frases-visualizacao"

const base = {
  FRASES_LISTA,
  FRASES_VIEW,
  TIPOS,
  DIFICULDADES,
  MESES,
  tipoDe: Object.fromEntries(["Lyrics", "Chords", "Tab", "Sheet", "lyrics", "Desconhecido", ""].map((t) => [t, tipoDe(t)])),
}
console.log(JSON.stringify(base, null, 2))
