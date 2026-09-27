"use client"

/**
 * `/login` com a identidade da folha `1-auth` (I1-PR6): `AUTH-login` e os
 * estados derivados. A lógica (o fluxo da I1-PR1, intacto) está em `use-login.ts`.
 * Credencial sob o campo; o Google sob o botão do Google; o resto na
 * `LinhaDeAviso`, uma por tela. Os `id` `#email` e `#password` ficam (os
 * roteiros da PR-1 e do pre-check os usam).
 */
import { useRef } from "react"
import Link from "next/link"
import { CascaAuth, RodapeAuth, SeparadorAuth } from "./casca-auth"
import { BotaoPrincipal, BotaoSecundario, CampoAuth, MarcaGoogle, Validacao } from "./controles-auth"
import { FRASES_AUTH } from "./frases-auth"
import { FRASES_SESSAO } from "./frases-sessao"
import { LinhaDeAviso } from "./linha-de-aviso"
import { useLogin } from "./use-login"

export function LoginPanel({ initialError = "" }: { initialError?: string }) {
  const l = useLogin(initialError)
  const form = useRef<HTMLFormElement>(null)

  if (l.abrindo) {
    return (
      <CascaAuth rotulo={FRASES_AUTH["login.rotulo"]} apoio={FRASES_AUTH["login.abrindo"]}>
        <RodapeAuth texto={FRASES_AUTH["login.nao-abriu"]}>
          <button type="button" onClick={() => (window.location.href = "/dashboard")} className="text-cor-accent-ink">
            {FRASES_AUTH["login.abrir-painel"]}
          </button>
        </RodapeAuth>
      </CascaAuth>
    )
  }

  const erroEmail = l.falha?.onde === "campo" && l.falha.campo === "email" ? l.falha.texto : undefined
  const erroSenha = l.falha?.onde === "campo" && l.falha.campo === "senha" ? l.falha.texto : undefined
  const tentar = l.aviso?.onTentar ?? (() => form.current?.requestSubmit())
  const ocupado = l.carregando !== null

  return (
    <CascaAuth rotulo={FRASES_AUTH["login.rotulo"]}>
      <form ref={form} onSubmit={l.handleSubmit} className="flex flex-col gap-espaco-xxl">
        <div className="flex flex-col gap-espaco-lg">
          <CampoAuth
            id="email" testid="campo-email" rotulo={FRASES_AUTH["login.email"]} icone="email" erro={erroEmail}
            type="email" required placeholder={FRASES_AUTH["login.email.placeholder"]}
            value={l.email} onChange={(e) => l.setEmail(e.target.value)}
          />
          <CampoAuth
            id="password" testid="campo-senha" rotulo={FRASES_AUTH["login.senha"]} icone="senha" erro={erroSenha}
            type="password" required value={l.password} onChange={(e) => l.setPassword(e.target.value)}
            acessorio={<Link href="/forgot-password" className="text-tam-label text-cor-accent-ink">{FRASES_AUTH["login.esqueci"]}</Link>}
          />
        </div>
        {l.aviso && (
          <LinhaDeAviso
            motivo={l.aviso.texto}
            tipo={l.aviso.tipo}
            acao={l.aviso.tentar ? { rotulo: FRASES_SESSAO["tentar-de-novo"], onPress: tentar } : undefined}
          />
        )}
        <div className="flex flex-col gap-espaco-lg">
          <BotaoPrincipal type="submit" icone="log-in" disabled={ocupado} carregando={l.carregando === "email"}>
            {l.carregando === "email" ? FRASES_AUTH["login.entrando"] : FRASES_AUTH["login.entrar"]}
          </BotaoPrincipal>
          <SeparadorAuth />
          <BotaoSecundario type="button" onClick={l.handleGoogleSignIn} disabled={ocupado} carregando={l.carregando === "google"}>
            <MarcaGoogle />
            {l.carregando === "google" ? FRASES_AUTH["login.google.carregando"] : FRASES_AUTH["login.google"]}
          </BotaoSecundario>
          {l.falha?.onde === "google" && <Validacao texto={l.falha.texto} />}
        </div>
      </form>
      <RodapeAuth texto={FRASES_AUTH["login.sem-conta"]}>
        <Link href="/signup" className="text-cor-accent-ink">{FRASES_AUTH["login.criar-conta"]}</Link>
      </RodapeAuth>
    </CascaAuth>
  )
}
