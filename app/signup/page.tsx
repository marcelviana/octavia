import { redirect } from "next/navigation"
import { getServerSideUser } from "@/lib/firebase-server-utils"
import { cookies } from "next/headers"
import { SignupPanel } from "@/components/auth/signup-panel"

// I1-PR6: a vitrine ("Start Your Musical Journey" e os quatro destaques) sai — nota de `AUTH-signup`
export default async function SignupPage() {
  const user = await getServerSideUser(await cookies())

  if (user) {
    redirect("/dashboard")
  }

  return <SignupPanel />
}
