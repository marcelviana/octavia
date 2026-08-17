import { cookies } from "next/headers"
import { requirePageUser } from "@/lib/require-page-user"
import ProfilePageClient from "@/components/profile-page-client"

// B1.2a: wrapper server de enforcement — o redirect client-side
// (router.replace pós-hidratação) da página original vira redirect server
// ANTES de qualquer render; o fallback client permanece no componente
// (defesa em profundidade). Sem metadata/dynamic/props na original.
export default async function ProfilePage() {
  await requirePageUser(await cookies())
  return <ProfilePageClient />
}
