"use client"

/**
 * A cifra (I1-PR-10; folha 5, `VIEW-cifra` / `VIEW-vazio-cifra`): o painel *Cifra* com o corpo mono 22 que rola
 * dentro dele. Todas as formas de `content_data` de antes viram texto no corpo (decisão 10, `corpo-de-texto.ts`);
 * sem dado, o vazio honesto (N5) no lugar dos quatro acordes-fixture de antes.
 */
import { CentroDoPainel, CorpoMono, Painel } from "@/components/content/painel"
import { textoDaCifra } from "@/components/content/corpo-de-texto"
import { FRASES_VIEW, rotuloDoTipo } from "@/components/content/frases-visualizacao"
import { dadosDe, type ConteudoVisto } from "@/components/content/tipos"

export function ChordDisplay({ content }: { content: ConteudoVisto }) {
  const corpo = textoDaCifra(dadosDe(content))
  return (
    <Painel rotulo={rotuloDoTipo("Chords")} testid="painel-cifra">
      {corpo ? <CorpoMono>{corpo}</CorpoMono> : <CentroDoPainel icone frase={FRASES_VIEW["view.vazio.cifra"]} />}
    </Painel>
  )
}
