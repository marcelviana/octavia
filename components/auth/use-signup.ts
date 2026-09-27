"use client"

/**
 * A lógica do `/signup` (I1-PR6: extraída do `signup-panel.tsx`). O fluxo é o de
 * sempre (I1-D9): a mesma verificação das senhas ANTES de qualquer request, o
 * mesmo `signUp`, o mesmo destino. Muda a forma da falha: `FraseDeErro` pelo
 * código (decisão 5 do aval); as senhas diferentes ficam sob o campo.
 */
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type ErroDeAuth } from "@/contexts/firebase-auth-context"
import { FRASES_AUTH, fraseDoErroDeCriar, type FraseDeErro } from "./frases-auth"

export function useSignup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [primaryInstrument, setPrimaryInstrument] = useState("")
  const [falha, setFalha] = useState<FraseDeErro | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFalha(null)

    if (password !== confirmPassword) {
      setFalha({ onde: "campo", campo: "confirmar", texto: FRASES_AUTH["signup.senhas"] })
      setIsLoading(false)
      return
    }

    try {
      const { error, data } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        primary_instrument: primaryInstrument,
      })

      if (error) {
        setFalha(fraseDoErroDeCriar((error as ErroDeAuth).codigo))
        return
      }

      // Check if email verification is required (Firebase Auth)
      if (data?.user && !data.user.emailVerified) {
        router.push("/signup/confirm-email")
      } else {
        router.push("/")
      }
    } catch (err) {
      setFalha(fraseDoErroDeCriar(undefined))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    campos: { email, password, confirmPassword, firstName, lastName, primaryInstrument },
    set: { setEmail, setPassword, setConfirmPassword, setFirstName, setLastName, setPrimaryInstrument },
    falha, isLoading, handleSubmit,
  }
}
