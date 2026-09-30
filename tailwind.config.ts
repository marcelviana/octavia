import type { Config } from "tailwindcss"
import { dark, light, font, limiares, radius, size, space, touch, bar, lineHeight, tracking } from "@octavia/identidade"

/**
 * I1-PR-6 (decisão 1 do aval): a identidade entra no Tailwind por NOME de
 * token, e todo valor é `var(--…)` do `app/styles/identidade.css` (gerado de
 * `@octavia/identidade`). Nenhum número mora aqui: as chaves saem dos objetos do
 * pacote e as faixas, dos `limiares` (o mesmo intervalo do `faixaDe`). O G-tok
 * aceita a classe com nome de token (`bg-cor-bg`, `p-espaco-xl`,
 * `w-web-coluna-auth`) e reprova o literal e o valor arbitrário.
 */
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
const porNome = (prefixo: string, obj: object, cssPrefixo = prefixo) =>
  Object.fromEntries(Object.keys(obj).map((k) => [`${prefixo}-${kebab(k)}`, `var(--${cssPrefixo}-${kebab(k)})`]))
/** As medidas por faixa do bloco `web` que as telas usam como tamanho (`--faixa-*`). */
const WEB = ["margem", "coluna-lateral", "zona-arquivo", "linha-lista", "linha-musica", "marca-largura", "marca-altura",
  "coluna-auth", "vao-auth", "campo-auth", "botao-auth", "botao-aviso", "entrelinha-aviso", "limiar-aviso", "folha-largura", "folha-topo"]
const medidas = {
  ...porNome("espaco", space),
  ...porNome("toque", touch),
  ...porNome("barra", bar),
  ...Object.fromEntries(WEB.map((k) => [`web-${k}`, `var(--faixa-${k})`])),
  // (touch.min − 20) / 2: o respiro vertical da LinhaDeAviso, DERIVADO (README-design §4 item 9)
  "aviso-respiro": "calc((var(--toque-min) - var(--faixa-entrelinha-aviso)) / 2)",
  // I1-PR-10 (folha 5, cabeçalho em B): as ações descem com recuo `touch.min + space.lg`, DERIVADO
  "recuo-cabecalho": "calc(var(--toque-min) + var(--espaco-lg))",
  // I1-PR-11 (folha 6, README-design §2.4 "campo"): duas linhas = 2 × touch.min; a letra = 5 × touch.min — DERIVADOS
  "campo-duas-linhas": "calc(var(--toque-min) * 2)",
  "campo-letra": "calc(var(--toque-min) * 5)",
}
const identidade = {
  screens: {
    // B e A empilham; C é a faixa larga. `c:` = (width > bc), como o `faixaDe`.
    c: { raw: `(width > ${limiares.bc}px)` },
    b: { raw: `(${limiares.ab}px <= width <= ${limiares.bc}px)` },
  },
  colors: {
    cor: {
      ...Object.fromEntries(Object.keys(dark).map((k) => [kebab(k), `var(--cor-${kebab(k)})`])),
      // I1-PR-9 (folha 4): accent a 12 % (marcado) e bg a 82 % (fundo do diálogo) — `web.alfa*`, color-mix no gerador
      marcado: "var(--faixa-cor-marcado)",
      dialogo: "var(--faixa-cor-dialogo)",
      // I1-PR-10 (folha 5): a paleta clara é o "papel" da página do PDF (`light.bg` + contorno `light.line`)
      ...Object.fromEntries(Object.keys(light).map((k) => [`claro-${kebab(k)}`, `var(--cor-claro-${kebab(k)})`])),
    },
  },
  spacing: medidas,
  maxWidth: { "web-conteiner": "var(--faixa-conteiner)" },
  fontSize: { ...porNome("tam", size, "tamanho"), "tam-web-metadado": "var(--faixa-metadado)", "tam-zoom-padrao": "var(--zoom-padrao)" },
  fontFamily: Object.fromEntries(Object.keys(font).map((k) => [`fam-${kebab(k)}`, [`var(--fonte-${kebab(k)}-familia)`]])),
  fontWeight: Object.fromEntries(Object.keys(font).map((k) => [`peso-${kebab(k)}`, `var(--fonte-${kebab(k)}-peso)`])),
  // `natural` = a entrelinha da própria fonte (`normal`), a da folha, que não declara entrelinha no corpo — não é
  // medida; o `leading-normal` do Tailwind é 1.5 e o G-tok o reprova (div. 663)
  lineHeight: { ...porNome("entrelinha", lineHeight), "web-entrelinha-aviso": "var(--faixa-entrelinha-aviso)", natural: "normal" },
  letterSpacing: Object.fromEntries(Object.keys(tracking).map((k) => [kebab(k), `var(--tracking-${kebab(k)})`])),
  borderRadius: porNome("raio", radius),
  borderWidth: { hairline: "var(--barra-hairline)" },
}

const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    // I1-PR-14 (div. 896): o `.tsx` de `lib/` renderiza (o limite global) — o que ele pintar tem de estar no CSS
    "./lib/**/*.tsx",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  // I1-PR-14 (decisão 6 do aval): o tema velho saiu — as cores do shadcn (`hsl(var(--…))`), `cream`/`beige`/`taupe`,
  // o `borderRadius` sobre `--radius`, o acordeão, o `container`, o `darkMode`, o `safelist` e o plugin
  // `tailwindcss-animate`: nenhum arquivo os usava depois da poda (docs/ux/I1-PR14-anexos/cn/tema-velho.txt). A
  // camada `base` do `app/globals.css` passou aos tokens. Só a identidade mora aqui.
  theme: {
    extend: {
      screens: identidade.screens,
      spacing: identidade.spacing,
      maxWidth: identidade.maxWidth,
      fontSize: identidade.fontSize,
      fontFamily: identidade.fontFamily,
      fontWeight: identidade.fontWeight,
      lineHeight: identidade.lineHeight,
      letterSpacing: identidade.letterSpacing,
      borderWidth: identidade.borderWidth,
      colors: identidade.colors,
      borderRadius: identidade.borderRadius,
    },
  },
} satisfies Config

export default config
