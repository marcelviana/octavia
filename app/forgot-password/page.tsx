"use client"

/**
 * `/forgot-password` com a identidade da folha `1-auth` (I1-PR6): `AUTH-forgot`
 * e derivados. O fluxo é o de sempre (I1-D9): o mesmo `sendPasswordResetEmail`,
 * uma request por envio. O código aqui não conhece o status: a falha é
 * `forgot.erro` (com `motivo.generico`), e não mais o `err.message` cru do
 * Firebase. *Tentar de novo* reenvia o MESMO formulário (div. 658).
 */
import type React from "react"
import { useRef, useState } from "react"
import Link from "next/link"
import { auth, isFirebaseConfigured } from "@/lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { CascaAuth, RodapeAuth } from "@/components/auth/casca-auth"
import { BotaoPrincipal, CampoAuth } from "@/components/auth/controles-auth"
import { LinkBotao } from "@/components/identidade/link-botao"
import { FRASES_AUTH, comDado } from "@/components/auth/frases-auth"
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso"

type Falha = "indisponivel" | "erro"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [falha, setFalha] = useState<Falha | null>(null)
  const form = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFalha(null)
    setIsLoading(true)

    if (!isFirebaseConfigured || !auth) {
      setFalha("indisponivel")
      setIsLoading(false)
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setIsSubmitted(true)
    } catch (err: any) {
      setFalha("erro")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <CascaAuth rotulo={FRASES_AUTH["forgot.veja"]} apoio={comDado("forgot.enviado", { email })}>
        <div className="flex flex-col gap-espaco-lg">
          <BotaoPrincipal type="button" onClick={() => setIsSubmitted(false)}>
            {FRASES_AUTH["acao.tentar"]}
          </BotaoPrincipal>
          <Link href="/login">
            <LinkBotao icone="voltar">{FRASES_AUTH["forgot.voltar"]}</LinkBotao>
          </Link>
        </div>
      </CascaAuth>
    )
  }

  return (
    <CascaAuth rotulo={FRASES_AUTH["forgot.rotulo"]} apoio={FRASES_AUTH["forgot.apoio"]}>
      <form ref={form} onSubmit={handleSubmit} className="flex flex-col gap-espaco-xxl">
        <CampoAuth
          id="email" testid="campo-email" rotulo={FRASES_AUTH["login.email"]} icone="email" type="email" required
          placeholder={FRASES_AUTH["login.email.placeholder"]} value={email} onChange={(e) => setEmail(e.target.value)}
        />
        {falha === "indisponivel" && <LinhaDeAviso motivo={FRASES_AUTH["forgot.indisponivel"]} />}
        {falha === "erro" && (
          <LinhaDeAviso
            motivo={FRASES_AUTH["forgot.erro"]}
            acao={{ rotulo: FRASES_AUTH["acao.tentar"], onPress: () => form.current?.requestSubmit() }}
          />
        )}
        <BotaoPrincipal type="submit" disabled={isLoading} carregando={isLoading}>
          {isLoading ? FRASES_AUTH["forgot.enviando"] : FRASES_AUTH["forgot.enviar"]}
        </BotaoPrincipal>
      </form>
      <RodapeAuth texto={FRASES_AUTH["forgot.lembrou"]}>
        <Link href="/login" className="text-cor-accent-ink">{FRASES_AUTH["forgot.entrar"]}</Link>
      </RodapeAuth>
    </CascaAuth>
  )
}
