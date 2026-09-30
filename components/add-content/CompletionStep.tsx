"use client";

/**
 * O pronto (I1-PR-12; folha `7-upload`, `UP-pronto`): `garantida` de 28 em tinta neutra, *pronto* (`font.display` ·
 * `size.title`), *“{título}”, de {artista}, está na biblioteca* e *Ir para a biblioteca*. Pisca antes do
 * redirecionamento ao content criado, como antes. O 🎉, as duas frases de apoio e o *Add Another* / *Import More*
 * saíram (decisão 9 do aval: o *Adicionar* da casca já reinicia o formulário).
 */
import { Icone } from "@/components/identidade/icone";
import { CONTROLE_LISTA } from "@/components/identidade/controles";
import { FRASES_UP, fraseUp } from "@/components/upload/frases-upload";

interface CompletionStepProps {
  titulo: string;
  artista: string;
  onIrParaABiblioteca: () => void;
}

export function CompletionStep({ titulo, artista, onIrParaABiblioteca }: CompletionStepProps) {
  return (
    <div className="py-espaco-xxxl flex flex-col items-center justify-center gap-espaco-lg text-center">
      <Icone nome="garantida" tamanho={28} className="text-cor-text" />
      <p className="font-fam-display font-peso-display text-tam-title tracking-display uppercase leading-natural">{FRASES_UP["up.pronto"]}</p>
      <p className="text-tam-body text-cor-muted break-words max-w-full">{fraseUp("up.pronto.apoio", { titulo, artista })}</p>
      <button type="button" onClick={onIrParaABiblioteca} className={`${CONTROLE_LISTA} border-cor-line-info`}>
        {FRASES_UP["up.ir-biblioteca"]}
      </button>
    </div>
  );
}
