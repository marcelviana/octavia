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
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
      colors: {
        ...identidade.colors,
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Octavia App Color Palette
        cream: {
          light: "#fffcf7", // NEW: Very light cream for main backgrounds
          DEFAULT: "#fff9f0", // Current cream for boxes/cards
        },
        beige: {
          light: "#F8F4ED", // Light beige for general use
          DEFAULT: "#F2EDE5", // Beige for boxes/cards
        },
        taupe: {
          DEFAULT: "#A69B8E", // Secondary text and borders
        },
      },
      borderRadius: {
        ...identidade.borderRadius,
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    // Ensure all content type colors are included in build
    'text-purple-600', 'text-purple-500',
    'border-purple-200', 'bg-purple-50',
    'hover:bg-purple-50', 'hover:border-purple-200',
    'ring-purple-500',
    'text-green-600', 'text-green-500',
    'border-green-200', 'bg-green-50',
    'hover:bg-green-50', 'hover:border-green-200',
    'ring-green-500',
    'text-blue-600', 'text-blue-500',
    'border-blue-200', 'bg-blue-50',
    'hover:bg-blue-50', 'hover:border-blue-200',
    'ring-blue-500',
    'text-orange-600', 'text-orange-500',
    'border-orange-200', 'bg-orange-50',
    'hover:bg-orange-50', 'hover:border-orange-200',
    'ring-orange-500',
  ],
} satisfies Config

export default config
