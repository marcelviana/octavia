/**
 * Uma lista do painel — *Recentes* ou *Favoritas* (I1-PR-9; folha 4, `DASH`,
 * README-design §2.4 "lista do painel"): título em `font.display` ·
 * `size.button` · `tracking.display`, caixa alta, `muted`; linha `touch.list`
 * com o ícone do tipo 20 em `lineInfo`, o título `size.body` e o tipo em
 * `web.metadado` (13, literal V1 §4.4). A linha abre `/content/<id>`, como antes. O `touch.list` é o
 * CONTEÚDO da linha (o contorno de cima soma 1, como na folha: 57 por linha).
 * Três casos (vazio ≠ erro): linhas; a frase de vazio (o servidor respondeu
 * nada); na falha, NEM linha NEM frase — quem fala é a linha da tela (`DASH-erro`).
 */
import Link from "next/link"
import type { ContentItem } from "@/components/dashboard"
import { Icone } from "@/components/identidade/icone"
import { tipoDe } from "@/components/library/frases-lista"

export interface ListaDoPainelProps {
  titulo: string
  vazio: string
  itens: ContentItem[]
  falhou: boolean
}

export function ListaDoPainel({ titulo, vazio, itens, falhou }: ListaDoPainelProps) {
  return (
    <section className="border-hairline border-cor-line rounded-raio-control pt-espaco-lg pb-espaco-sm flex flex-col">
      <h2 className="font-fam-display font-peso-display text-tam-button tracking-display uppercase text-cor-muted px-espaco-xl pb-espaco-sm leading-natural">
        {titulo}
      </h2>
      {!falhou && itens.length === 0 && (
        <p className="border-t-hairline border-cor-line py-espaco-lg px-espaco-xl text-tam-label text-cor-muted">{vazio}</p>
      )}
      {!falhou &&
        itens.map((item) => {
          const tipo = tipoDe(item.content_type)
          return (
            <Link
              key={item.id}
              href={`/content/${item.id}`}
              className="box-content min-h-toque-list flex items-center gap-espaco-lg px-espaco-xl border-t-hairline border-cor-line"
            >
              <Icone nome={tipo.icone} tamanho={20} className="text-cor-line-info" />
              <span className="flex-1 min-w-0 text-tam-body text-cor-text break-words">{item.title}</span>
              <span className="shrink-0 text-tam-web-metadado text-cor-muted">{tipo.rotulo}</span>
            </Link>
          )
        })}
    </section>
  )
}
