"use client"

/**
 * A letra (I1-PR-10; folha 5, `VIEW-letra` / `VIEW-vazio-letra`): o painel *Letra* com o corpo mono 22 (o
 * `MusicText` de antes — negrito e itálico seguem —, sem quebra, rolando dentro do painel). Os acordes que a letra
 * traz vão num SEGUNDO painel *Cifra* (decisão 10; I1-E18).
 */
import { MusicText } from "@/components/music-text"
import { CentroDoPainel, CorpoMono, Painel } from "@/components/content/painel"
import { textoDaLetra, textoDosAcordes } from "@/components/content/corpo-de-texto"
import { FRASES_VIEW, rotuloDoTipo } from "@/components/content/frases-visualizacao"
import { dadosDe, type ConteudoVisto } from "@/components/content/tipos"

export function LyricsDisplay({ content }: { content: ConteudoVisto }) {
  const dados = dadosDe(content)
  const letra = textoDaLetra(dados)
  const acordes = textoDosAcordes(dados?.chords)
  return (
    <>
      <Painel rotulo={rotuloDoTipo("Lyrics")} testid="painel-letra">
        {letra ? (
          <CorpoMono>
            {/* o <pre> do MusicText herda o corpo; `font-fam-mono` vence o `pre` do preflight (div. 757) */}
            <MusicText text={letra} monospace={false} className="whitespace-pre font-fam-mono" />
          </CorpoMono>
        ) : (
          <CentroDoPainel icone frase={FRASES_VIEW["view.vazio.letra"]} apoio={FRASES_VIEW["view.vazio.letra.apoio"]} />
        )}
      </Painel>
      {acordes && (
        <Painel rotulo={rotuloDoTipo("Chords")} testid="painel-cifra">
          <CorpoMono>{acordes}</CorpoMono>
        </Painel>
      )}
    </>
  )
}
