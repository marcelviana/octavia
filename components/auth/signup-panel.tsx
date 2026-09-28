"use client"

/**
 * `/signup` com a identidade da folha `1-auth` (I1-PR6): `AUTH-signup` e os
 * estados derivados. A lógica está em `use-signup.ts`. Os campos numa coluna,
 * o instrumento é o `<select>` de hoje (valores iguais; rótulos em pt-BR),
 * "no mínimo 6 caracteres" sob a senha, as senhas diferentes sob a confirmação.
 */
import { useRef } from "react"
import Link from "next/link"
import { CascaAuth, RodapeAuth } from "./casca-auth"
import { BotaoPrincipal, CampoAuth } from "./controles-auth"
import { FRASES_AUTH } from "./frases-auth"
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso"
import { SeletorDeInstrumento } from "./seletor-de-instrumento"
import { useSignup } from "./use-signup"

export function SignupPanel() {
  const { campos: c, set, falha, isLoading, handleSubmit } = useSignup()
  const form = useRef<HTMLFormElement>(null)
  const erroConfirmar = falha?.onde === "campo" && falha.campo === "confirmar" ? falha.texto : undefined

  return (
    <CascaAuth rotulo={FRASES_AUTH["signup.rotulo"]}>
      <form ref={form} onSubmit={handleSubmit} className="flex flex-col gap-espaco-xxl">
        <div className="flex flex-col gap-espaco-lg">
          <CampoAuth id="firstName" testid="campo-nome" rotulo={FRASES_AUTH["signup.nome"]} required
            value={c.firstName} onChange={(e) => set.setFirstName(e.target.value)} />
          <CampoAuth id="lastName" testid="campo-sobrenome" rotulo={FRASES_AUTH["signup.sobrenome"]} required
            value={c.lastName} onChange={(e) => set.setLastName(e.target.value)} />
          <CampoAuth id="email" testid="campo-email" rotulo={FRASES_AUTH["login.email"]} icone="email" type="email" required
            placeholder={FRASES_AUTH["login.email.placeholder"]} value={c.email} onChange={(e) => set.setEmail(e.target.value)} />
          <SeletorDeInstrumento valor={c.primaryInstrument} onMudar={set.setPrimaryInstrument} />
          <CampoAuth id="password" testid="campo-senha" rotulo={FRASES_AUTH["login.senha"]} icone="senha" type="password" required
            minLength={6} dica={FRASES_AUTH["signup.senha.dica"]} value={c.password} onChange={(e) => set.setPassword(e.target.value)} />
          <CampoAuth id="confirmPassword" testid="campo-confirmar" rotulo={FRASES_AUTH["signup.confirmar"]} icone="senha" type="password"
            required erro={erroConfirmar} value={c.confirmPassword} onChange={(e) => set.setConfirmPassword(e.target.value)} />
        </div>
        {falha?.onde === "linha" && (
          <LinhaDeAviso
            motivo={falha.texto}
            tipo={falha.tipo}
            acao={falha.tentar ? { rotulo: FRASES_AUTH["acao.tentar"], onPress: () => form.current?.requestSubmit() } : undefined}
          />
        )}
        <BotaoPrincipal type="submit" disabled={isLoading} carregando={isLoading}>
          {isLoading ? FRASES_AUTH["signup.criando"] : FRASES_AUTH["signup.criar"]}
        </BotaoPrincipal>
      </form>
      <RodapeAuth texto={FRASES_AUTH["signup.ja-tem"]}>
        <Link href="/login" className="text-cor-accent-ink">{FRASES_AUTH["signup.voltar"]}</Link>
      </RodapeAuth>
    </CascaAuth>
  )
}
