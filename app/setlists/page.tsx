import { cookies } from "next/headers"
import { requirePageUser } from "@/lib/require-page-user"
import SetlistsPageClient from "@/components/setlists-page-client"

// B1.2a: wrapper server de enforcement — a página client original (movida
// intacta para components/setlists-page-client.tsx) renderizava shell para
// qualquer um; a verificação era 100% do middleware. Agora a página expulsa
// por conta própria (gate G-rotas). A original não exportava metadata/
// dynamic/generateStaticParams nem consumia params/searchParams — nada a
// preservar além do conteúdo.
export default async function SetlistsPage() {
  await requirePageUser(await cookies())
  return <SetlistsPageClient />
}
