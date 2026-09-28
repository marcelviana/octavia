"use client"

/**
 * A CASCA do web com sessão (I1-PR-9; folha `4-content-lista`, README-design §2.4
 * "barra superior"): uma barra de `bar.top` com marca (texto, `font.display` ·
 * `size.title` · `tracking.displayWide`, nome acessível *Octavia*) · navegação
 * (Painel · Biblioteca · Setlists · Adicionar; item `touch.min`, `radius.control`,
 * `size.bodySmall`, `muted`; o ativo em `text`, contorno `accentInk`, fundo
 * marcado) · busca (`touch.min`, contorno `lineInfo`, ícone 20) · conta.
 *
 * Em C, uma linha. Em B (e em A, mecânica — errata da I1-D11) EMPILHA: marca ·
 * busca · conta na linha de `bar.top` e a navegação numa linha de `touch.list`
 * (a mesma ordem da folha: `order` + `basis-full`; `c:` é a linha única).
 *
 * Substitui a casca velha (`responsive-layout`, `header`, `navigation-container`,
 * `sidebar`, `bottom-nav`, `user-header`) nos seis *page-clients* com sessão. A
 * busca vai para `/library?search=` como antes; a navegação vai aos mesmos quatro
 * destinos (por `<Link>`, o ativo pelo caminho). A página rola no documento.
 */
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Icone } from "@/components/identidade/icone"
import { ContaDaCasca } from "@/components/identidade/conta-da-casca"
import { FRASES_CASCA, type ChaveCasca } from "@/components/identidade/frases-casca"

const DESTINOS: readonly { chave: ChaveCasca; href: string; ativoEm: readonly string[] }[] = [
  { chave: "casca.painel", href: "/dashboard", ativoEm: ["/dashboard"] },
  { chave: "casca.biblioteca", href: "/library", ativoEm: ["/library", "/content"] },
  { chave: "casca.setlists", href: "/setlists", ativoEm: ["/setlists"] },
  { chave: "casca.adicionar", href: "/add-content", ativoEm: ["/add-content"] },
]

const ITEM = "h-toque-min px-espaco-lg rounded-raio-control border-hairline flex items-center text-tam-body-small"

function Busca({ inicial }: { inicial: string }) {
  const router = useRouter()
  const [consulta, setConsulta] = useState(inicial)
  useEffect(() => setConsulta(inicial), [inicial])
  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const t = consulta.trim()
    router.push(t ? `/library?search=${encodeURIComponent(t)}` : "/library")
  }
  return (
    <form role="search" data-testid="casca-busca" onSubmit={enviar} className="flex-1 min-w-0 h-toque-min border-hairline border-cor-line-info rounded-raio-control flex items-center gap-espaco-md px-espaco-lg">
      <Icone nome="busca" tamanho={20} className="text-cor-line-info" />
      <input
        type="search"
        data-testid="casca-busca-campo"
        aria-label={FRASES_CASCA["casca.buscar"]}
        placeholder={FRASES_CASCA["casca.buscar"]}
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        className="flex-1 min-w-0 bg-cor-bg text-cor-text text-tam-body-small placeholder:text-cor-muted outline-none"
      />
    </form>
  )
}

export interface CascaProps {
  children: React.ReactNode
  /** o termo da busca na URL, para o campo mostrar (só a biblioteca o passa) */
  buscaInicial?: string
  /** clicar no item de navegação JÁ ATIVO (o upload reinicia o formulário, como a lateral de antes fazia) */
  aoReclicarAtivo?: () => void
}

export function Casca({ children, buscaInicial = "", aoReclicarAtivo }: CascaProps) {
  const caminho = usePathname() ?? ""
  return (
    <div className="min-h-screen bg-cor-bg text-cor-text font-fam-ui font-peso-ui leading-natural flex flex-col">
      <header className="border-b-hairline border-cor-line">
        <div className="w-full max-w-web-conteiner mx-auto flex flex-wrap items-center gap-x-espaco-xl px-web-margem">
          <div role="img" aria-label={FRASES_CASCA["casca.marca.nome"]} className="order-1 h-barra-top flex items-center font-fam-display font-peso-display text-tam-title tracking-display-wide text-cor-text">
            {FRASES_CASCA["casca.marca"]}
          </div>
          <nav aria-label={FRASES_CASCA["casca.navegacao"]} className="order-4 basis-full min-h-toque-list flex flex-wrap items-center gap-espaco-sm c:order-2 c:basis-auto c:h-barra-top">
            {DESTINOS.map((d) => {
              const ativo = d.ativoEm.some((p) => caminho === p || caminho.startsWith(`${p}/`))
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  aria-current={ativo ? "page" : undefined}
                  onClick={ativo ? aoReclicarAtivo : undefined}
                  className={`${ITEM} ${ativo ? "border-cor-accent-ink bg-cor-marcado text-cor-text" : "border-transparent text-cor-muted"}`}
                >
                  {FRASES_CASCA[d.chave]}
                </Link>
              )
            })}
          </nav>
          <div className="order-3 flex-1 min-w-0 h-barra-top flex items-center gap-espaco-lg">
            <Busca inicial={buscaInicial} />
            <ContaDaCasca />
          </div>
        </div>
      </header>
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  )
}

/** O conteúdo das telas redesenhadas: contêiner `web.conteiner`, margem `web.margem`, respiro `space.xxl`, vão `space.xl`. */
export function ConteudoDaCasca({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-web-conteiner mx-auto flex flex-col gap-espaco-xl py-espaco-xxl px-web-margem">{children}</div>
}
