/**
 * O PAINEL do corpo da visualização (I1-PR-10; folha `5-content-visualizacao`, README-design §2.4 "painel",
 * "corpo de texto", "vazio do painel"): contorno `line` · `radius.control`; o rótulo em `font.mono` ·
 * `size.labelSmall` · `tracking.label`, caixa alta, `muted`, numa linha de `touch.min` (+ o contorno de baixo: 49,
 * como a folha — `box-content`, o precedente da div. 722).
 *
 * O corpo de texto: `font.mono` · `zoomDefault` (22) · `lineHeight.text` (a tab: `lineHeight.tab`), SEM quebra — a
 * linha longa rola na horizontal DENTRO do painel (resposta 19), marcado `data-rolagem="painel"` (decisão 621: o
 * G-faixa conta essa rolagem como (d′), não (b)).
 */
import { Icone } from "@/components/identidade/icone"

export function Painel({ rotulo, children, testid }: { rotulo: string; children: React.ReactNode; testid?: string }) {
  return (
    <section data-testid={testid} className="border-hairline border-cor-line rounded-raio-control flex flex-col">
      <h2 className="box-content h-toque-min flex items-center px-espaco-xl border-b-hairline border-cor-line font-fam-mono font-peso-mono text-tam-label-small tracking-label uppercase text-cor-muted leading-natural">
        {rotulo}
      </h2>
      {children}
    </section>
  )
}

/** O corpo mono que rola dentro do painel; `tab` usa a entrelinha da tablatura. */
export function CorpoMono({ children, tab = false }: { children: React.ReactNode; tab?: boolean }) {
  return (
    <div data-rolagem="painel" className="overflow-x-auto p-espaco-xl">
      <div className={`font-fam-mono font-peso-mono text-tam-zoom-padrao whitespace-pre text-cor-text ${tab ? "leading-entrelinha-tab" : "leading-entrelinha-text"}`}>
        {children}
      </div>
    </div>
  )
}

/** O centro do painel: vazio (o `sem-conteudo` 28 em `lineInfo`, a frase e o apoio), carregando, ou nada (erro). */
export function CentroDoPainel({ icone = false, frase, apoio }: { icone?: boolean; frase?: string; apoio?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-espaco-md py-espaco-xxxl px-espaco-xl text-center">
      {icone && <Icone nome="sem-conteudo" tamanho={28} className="text-cor-line-info" />}
      {frase && <p className="text-tam-body text-cor-text">{frase}</p>}
      {apoio && <p className="text-tam-label text-cor-muted">{apoio}</p>}
    </div>
  )
}
