"use client"

/**
 * A lógica do `/login` (I1-PR6: extraída do `login-panel.tsx`, CLAUDE.md "< 150
 * linhas"). O FLUXO é o da I1-PR1, sem mudança (I1-D9): navega uma vez e só com
 * a sessão aberta (2xx); nenhum `GET /api/profile` antes; as mesmas requests,
 * na mesma ordem. O que muda é a FORMA da falha — uma `FraseDeErro` pelo
 * código (decisão 5 do aval) no lugar da string em inglês — e o erro de perfil,
 * que volta ao formulário com a `LinhaDeAviso` (decisão 6, div. 638).
 */
import { useEffect, useState } from "react"
import { useAuth, type ErroDeAuth } from "@/contexts/firebase-auth-context"
import type { FalhaSessao } from "@/lib/firebase-session-cookies"
import { FRASES_SESSAO, fraseDaFalha } from "./frases-sessao"
import { FRASES_AUTH, fraseDoErroDeEntrar, fraseDoErroDoGoogle, type FraseDeErro, type TipoAviso } from "./frases-auth"

const GENERICO: FraseDeErro = { onde: "linha", tipo: "falha", texto: FRASES_AUTH["motivo.generico"], tentar: false }
const SERVIDOR: FraseDeErro = { onde: "linha", tipo: "falha", texto: FRASES_SESSAO.servidor, tentar: true }
const RECUSADO: FraseDeErro = { onde: "linha", tipo: "falha", texto: FRASES_SESSAO.recusado, tentar: false }
const LIMITE: FraseDeErro = { onde: "linha", tipo: "limite", texto: FRASES_SESSAO["limite-sem-prazo"], tentar: false }

/** A falha do `POST /api/auth/session` (I1-PR1): tipo e ação pela folha (README-design §3). */
function daSessao(f: FalhaSessao): { tipo: TipoAviso; tentar: boolean } {
  if (f.motivo === "rede") return { tipo: "rede", tentar: true }
  if (f.motivo === "limite") return { tipo: "limite", tentar: false }
  return { tipo: "falha", tentar: f.motivo === "servidor" }
}

export function useLogin(initialError: string) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  // `?error_description=` (app/login/page.tsx): o texto do parâmetro não é frase — motivo.generico (div. 639)
  const [falha, setFalha] = useState<FraseDeErro | null>(initialError ? GENERICO : null)
  const [carregando, setCarregando] = useState<"email" | "google" | null>(null)
  const [hasRedirected, setHasRedirected] = useState(false)
  const { signIn, signInWithGoogle, user, isInitialized, idToken, refreshToken, sessao, tentarSessaoDeNovo } = useAuth()
  const sessaoAberta = sessao.estado === "aberta"
  const falhaDaSessao = sessao.estado === "falhou" ? sessao : null

  // I1-PR1 (b): a falha do POST /api/auth/session devolve a tela ao usuário
  useEffect(() => {
    if (falhaDaSessao) setCarregando(null)
  }, [falhaDaSessao])

  // I1-PR1 (a): navega uma vez, e só com o cookie aberto (2xx) — nenhum
  // GET /api/profile antes disso
  useEffect(() => {
    if (isInitialized && user && sessaoAberta && !hasRedirected) {
      setHasRedirected(true)
      const handleRedirect = async () => {
        try {
          // Always get a fresh token to avoid expiration issues
          let token = await refreshToken()
          if (!token) {
            // If refreshToken fails, try to get token directly from user.
            if (user) {
              const { getIdToken } = await import('firebase/auth')
              token = await getIdToken(user, true) // Force refresh
            }
          }

          if (!token) {
            setFalha(SERVIDOR) // "Unable to obtain authentication token" → 5xx e o resto (resposta 4)
            return
          }

          const res = await fetch('/api/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (res.ok) {
            const profileData = await res.json()
            if (profileData === null) {
              const createRes = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  id: user.uid,
                  email: user.email,
                  full_name: user.displayName || null,
                  first_name: user.displayName ? user.displayName.split(' ')[0] : null,
                  last_name: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : null,
                  avatar_url: user.photoURL || null,
                }),
              })

              if (!createRes.ok) {
                throw new Error('Failed to create profile')
              }
            }

            window.location.href = '/dashboard'
          } else if (res.status === 401) {
            // Token expired, try once more with a fresh token
            try {
              const { getIdToken } = await import('firebase/auth')
              const freshToken = await getIdToken(user, true)

              const retryRes = await fetch('/api/profile', {
                headers: {
                  Authorization: `Bearer ${freshToken}`,
                },
              })

              if (retryRes.ok) {
                const profileData = await retryRes.json()
                if (profileData === null) {
                  const createRes = await fetch('/api/profile', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${freshToken}`,
                    },
                    body: JSON.stringify({
                      id: user.uid,
                      email: user.email,
                      full_name: user.displayName || null,
                      first_name: user.displayName ? user.displayName.split(' ')[0] : null,
                      last_name: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : null,
                      avatar_url: user.photoURL || null,
                    }),
                  })

                  if (!createRes.ok) {
                    throw new Error('Failed to create profile')
                  }
                }
                window.location.href = '/dashboard'
              } else {
                setFalha(RECUSADO) // 401/403 (resposta 4)
              }
            } catch (retryError) {
              console.error('Token refresh retry failed:', retryError)
              setFalha(RECUSADO)
            }
          } else {
            // o 429 do perfil vai para o limite; 404/5xx, "5xx e o resto" (div. 638)
            setFalha(res.status === 429 ? LIMITE : SERVIDOR)
          }
        } catch (err: any) {
          console.error('Profile setup error:', err)
          setFalha(SERVIDOR)
        }
      }
      handleRedirect()
    }
  }, [user, isInitialized, sessaoAberta, hasRedirected, idToken, refreshToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFalha(null)
    setCarregando("email")

    try {

      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setFalha(fraseDoErroDeEntrar((signInError as ErroDeAuth).codigo))
        setCarregando(null)
        return
      }
      console.log("Login successful, waiting for auth state update...")
    } catch (err: any) {
      setFalha(GENERICO)
      setCarregando(null)
    }
  }

  const handleGoogleSignIn = async () => {
    setFalha(null)
    setCarregando("google")
    try {

      const { error: googleError } = await signInWithGoogle()
      if (googleError) {
        setFalha(fraseDoErroDoGoogle((googleError as ErroDeAuth).codigo))
        setCarregando(null)
      }
    } catch (err: any) {
      setFalha(fraseDoErroDoGoogle(undefined))
      setCarregando(null)
    }
  }

  /**
   * *Tentar de novo* (div. 658): no erro de perfil, roda o MESMO `handleRedirect` uma vez; na falha
   * de rede do *Entrar*, o painel reenvia o MESMO formulário. Sempre por ação do usuário, uma request.
   */
  const tentarPerfilDeNovo = () => {
    setFalha(null)
    setHasRedirected(false)
  }

  // Uma linha por tela (README-design §3): a falha da sessão vence a do formulário.
  const aviso = falhaDaSessao
    ? { texto: fraseDaFalha(falhaDaSessao.falha, falhaDaSessao.origem), ...daSessao(falhaDaSessao.falha), onTentar: () => void tentarSessaoDeNovo() }
    : falha?.onde === "linha"
      ? { texto: falha.texto, tipo: falha.tipo, tentar: falha.tentar, onTentar: hasRedirected ? tentarPerfilDeNovo : null }
      : null

  return {
    email, setEmail, password, setPassword, carregando, falha, aviso,
    abrindo: isInitialized && !!user && sessaoAberta && !falha,
    handleSubmit, handleGoogleSignIn,
  }
}
