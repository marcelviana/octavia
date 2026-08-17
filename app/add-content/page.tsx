import { cookies } from "next/headers"
import { requirePageUser } from "@/lib/require-page-user"
import AddContentPageClient from "@/components/add-content-page-client"

// B1.2a: wrapper server de enforcement — ver setlists/page.tsx; o
// next/dynamic com ssr:false da original permanece válido porque segue
// dentro de módulo client (components/add-content-page-client.tsx). Sem
// metadata/dynamic/props na original.
export default async function AddContentPage() {
  await requirePageUser(await cookies())
  return <AddContentPageClient />
}
