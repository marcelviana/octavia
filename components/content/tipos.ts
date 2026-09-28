/** O content como a visualização o recebe (a linha do banco, `GET`/SSR) — I1-PR-10. */
import type { Database } from "@/types/database.types"
import type { DadosDoConteudo } from "@/components/content/corpo-de-texto"

export type ConteudoVisto = Database["public"]["Tables"]["content"]["Row"]

export const dadosDe = (c: Pick<ConteudoVisto, "content_data">): DadosDoConteudo =>
  c.content_data && typeof c.content_data === "object" && !Array.isArray(c.content_data) ? (c.content_data as Record<string, unknown>) : null
