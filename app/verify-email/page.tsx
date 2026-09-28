"use client"

/**
 * `/verify-email` com a identidade da folha `1-auth` (I1-PR6): `AUTH-verify` e
 * derivados, mais o `AUTH-verify-reenviar-excecao` da errata I1-E1. O fluxo é o
 * de sempre (I1-D9): o mesmo `user.reload()`, o mesmo reenviar, o mesmo sair e
 * os mesmos redirecionamentos. Sem usuário, hoje era `return null`: vira
 * `estado.carregando` (`AUTH-verify-carregando`, resposta 14). Uma linha por
 * tela; *Tentar de novo* = a mesma ação que falhou (div. 658).
 */
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type ErroDeAuth } from "@/contexts/firebase-auth-context"
import { CascaAuth, RodapeAuth } from "@/components/auth/casca-auth"
import { BotaoPrincipal, BotaoSecundario } from "@/components/auth/controles-auth"
import { FRASES_AUTH, comDado, fraseDoErroDeReenviar, type FraseDeErro } from "@/components/auth/frases-auth"
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso"

type Falha = { frase: FraseDeErro; tentar?: () => void }

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [falha, setFalha] = useState<Falha | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const { resendVerificationEmail, user, signOut } = useAuth()
  const router = useRouter()

  const handleResendEmail = async () => {
    setIsResending(true)
    setFalha(null)
    setResendSuccess(false)

    try {
      const { error } = await resendVerificationEmail()
      if (error) {
        setFalha({ frase: fraseDoErroDeReenviar((error as ErroDeAuth).codigo), tentar: handleResendEmail })
      } else {
        setResendSuccess(true)
      }
    } catch (err) {
      setFalha({ frase: fraseDoErroDeReenviar(undefined), tentar: handleResendEmail })
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    setIsChecking(true)
    try {
      // Force a token refresh to get the latest email verification status
      await user?.reload()

      // Check if email is now verified
      if (user?.emailVerified) {
        router.push("/dashboard")
      } else {
        setFalha({ frase: { onde: "linha", tipo: "falha", texto: FRASES_AUTH["verify.nao-confirmado"], tentar: false } })
      }
    } catch (err) {
      setFalha({ frase: { onde: "linha", tipo: "falha", texto: FRASES_AUTH["verify.checar-falhou"], tentar: true }, tentar: handleCheckVerification })
    } finally {
      setIsChecking(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.emailVerified) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user) {
    return <CascaAuth rotulo={FRASES_AUTH["confirm.rotulo"]} apoio={FRASES_AUTH["estado.carregando"]} />
  }

  const f = falha?.frase
  return (
    <CascaAuth rotulo={FRASES_AUTH["confirm.rotulo"]} apoio={comDado("verify.apoio", { email: user.email ?? "" })}>
      {resendSuccess && <LinhaDeAviso tipo="sucesso" motivo={FRASES_AUTH["confirm.enviado"]} />}
      {f?.onde === "linha" && (
        <LinhaDeAviso
          motivo={f.texto}
          tipo={f.tipo}
          acao={f.tentar && falha?.tentar ? { rotulo: FRASES_AUTH["acao.tentar"], onPress: () => void falha.tentar?.() } : undefined}
        />
      )}
      <div className="flex flex-col gap-espaco-lg">
        <BotaoPrincipal type="button" onClick={handleCheckVerification} disabled={isChecking} carregando={isChecking}>
          {isChecking ? FRASES_AUTH["verify.conferindo"] : FRASES_AUTH["verify.ja-confirmei"]}
        </BotaoPrincipal>
        <BotaoSecundario type="button" onClick={handleResendEmail} disabled={isResending} carregando={isResending}>
          {isResending ? FRASES_AUTH["confirm.enviando"] : FRASES_AUTH["confirm.reenviar"]}
        </BotaoSecundario>
        <BotaoSecundario type="button" icone="sair" onClick={handleSignOut}>
          {FRASES_AUTH["verify.sair"]}
        </BotaoSecundario>
      </div>
      {/* como no confirm: o rodapé só no estado base (`AUTH-verify`) */}
      {!isChecking && !isResending && !resendSuccess && !falha && <RodapeAuth texto={FRASES_AUTH["verify.ajuda"]} />}
    </CascaAuth>
  )
}
