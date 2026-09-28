import { redirect } from "next/navigation"
import { getServerSideUser } from "@/lib/firebase-server-utils"
import { cookies } from "next/headers"
import { LoginPanel } from "@/components/auth/login-panel"

export default async function LoginPage({ searchParams }: { searchParams?: Promise<any> }) {
  const user = await getServerSideUser(await cookies())

  if (user) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const errorDescription = params?.error_description
  const error = typeof errorDescription === "string" ? errorDescription : ""

  // I1-PR6: a casca (fundo, marca, coluna) é do painel — CascaAuth
  return <LoginPanel initialError={error} />
}
