"use client"

/**
 * `/signup/confirm-email` com a identidade da folha `1-auth` (I1-PR6):
 * `AUTH-confirm` e derivados. O fluxo é o de sempre (I1-D9): o mesmo
 * `resendVerificationEmail`, uma request por clique. A falha vem pelo código
 * (decisão 5) na `LinhaDeAviso`; o sucesso também é linha (a tela não mostra
 * por si que o e-mail saiu, README-design §3). *Tentar de novo* = o mesmo
 * *Reenviar* (div. 658). Sem usuário, a linha do e-mail não existe (div. 637).
 */
import { useState } from "react"
import Link from "next/link"
import { useAuth, type ErroDeAuth } from "@/contexts/firebase-auth-context"
import { CascaAuth, RodapeAuth } from "@/components/auth/casca-auth"
import { BotaoSecundario } from "@/components/auth/controles-auth"
import { LinkBotao } from "@/components/identidade/link-botao"
import { FRASES_AUTH, comDado, fraseDoErroDeReenviar, type FraseDeErro } from "@/components/auth/frases-auth"
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso"

export default function ConfirmEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [falha, setFalha] = useState<FraseDeErro | null>(null)
  const { resendVerificationEmail, user } = useAuth()

  const handleResendEmail = async () => {
    setIsResending(true)
    setFalha(null)
    setResendSuccess(false)

    try {
      const { error } = await resendVerificationEmail()
      if (error) {
        setFalha(fraseDoErroDeReenviar((error as ErroDeAuth).codigo))
      } else {
        setResendSuccess(true)
      }
    } catch (err) {
      setFalha(fraseDoErroDeReenviar(undefined))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <CascaAuth
      rotulo={FRASES_AUTH["confirm.rotulo"]}
      apoio={user?.email ? comDado("confirm.apoio", { email: user.email }) : undefined}
    >
      {resendSuccess && <LinhaDeAviso tipo="sucesso" motivo={FRASES_AUTH["confirm.enviado"]} />}
      {falha?.onde === "linha" && (
        <LinhaDeAviso
          motivo={falha.texto}
          tipo={falha.tipo}
          acao={falha.tentar ? { rotulo: FRASES_AUTH["acao.tentar"], onPress: () => void handleResendEmail() } : undefined}
        />
      )}
      <div className="flex flex-col gap-espaco-lg">
        <Link href="/login">
          <LinkBotao principal>{FRASES_AUTH["confirm.ir-login"]}</LinkBotao>
        </Link>
        <BotaoSecundario type="button" onClick={handleResendEmail} disabled={isResending} carregando={isResending}>
          {isResending ? FRASES_AUTH["confirm.enviando"] : FRASES_AUTH["confirm.reenviar"]}
        </BotaoSecundario>
      </div>
      {/* a folha só mostra o rodapé no estado base (`AUTH-confirm`); nos derivados a linha fala */}
      {!isResending && !resendSuccess && !falha && <RodapeAuth texto={FRASES_AUTH["confirm.nao-recebeu"]} />}
    </CascaAuth>
  )
}
