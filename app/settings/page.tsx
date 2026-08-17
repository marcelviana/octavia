import { cookies } from "next/headers"
import { requirePageUser } from "@/lib/require-page-user"
import SettingsPageClient from "@/components/settings-page-client"

// B1.2a: wrapper server de enforcement — ver setlists/page.tsx; a página
// client original (components/settings-page-client.tsx) não exportava
// metadata/dynamic nem consumia props.
export default async function SettingsPage() {
  await requirePageUser(await cookies())
  return <SettingsPageClient />
}
