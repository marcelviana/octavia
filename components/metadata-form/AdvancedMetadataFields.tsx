"use client";

/**
 * As Opções avançadas (I1-PR-12; a folha `7-upload` só as desenha fechadas — nota de `UP-detalhes`): Tom · BPM ·
 * Dificuldade · Capo · Afinação · Compasso · Favorita, com os rótulos da §5.7 (aprovados na I1-PR-11) e os VALORES de
 * antes (os 12 tons, as três dificuldades). O Tom mostra o valor escolhido (decisão 14 do aval): antes a tela passava
 * `key={formData.key}`, que é a `key` do React — a prop chegava indefinida e a seleção remontava a cada escolha.
 * Herança D, não tocada: *Capo* e *Afinação* não vão no `POST`; *Compasso* e *Favorita* se perdem pelo nome.
 */
import { DIFICULDADES } from "@/components/library/frases-lista";
import { CaixaDeMarcar, Selecao } from "@/components/editors/campos";
import { Campo, campoDeUmaLinha } from "@/components/upload/pecas";
import { FRASES_UP, TONS_UP, type ChaveUp } from "@/components/upload/frases-upload";

interface AdvancedMetadataFieldsProps {
  tom: string;
  bpm: string;
  difficulty: string;
  capo: string;
  tuning: string;
  timeSignature: string;
  isFavorite: boolean;
  onChange: (field: string, value: string | boolean | string[]) => void;
}

type Nome = "bpm" | "capo" | "tuning" | "timeSignature";
const ENTRADAS: Record<Nome, { rotulo: ChaveUp; exemplo?: ChaveUp; numero?: boolean }> = {
  bpm: { rotulo: "up.av.bpm", numero: true },
  capo: { rotulo: "up.av.capo", exemplo: "up.av.capo.exemplo", numero: true },
  tuning: { rotulo: "up.av.afinacao" },
  timeSignature: { rotulo: "up.av.compasso" },
};

export function AdvancedMetadataFields({ tom, difficulty, isFavorite, onChange, ...valores }: AdvancedMetadataFieldsProps) {
  const entrada = (nome: Nome) => {
    const e = ENTRADAS[nome];
    return (
      <Campo rotulo={FRASES_UP[e.rotulo]} id={`up-${nome}`}>
        <input id={`up-${nome}`} data-testid={`campo-${nome}`} type={e.numero ? "number" : "text"} value={valores[nome]}
          placeholder={e.exemplo ? FRASES_UP[e.exemplo] : undefined} className={campoDeUmaLinha()} onChange={(ev) => onChange(nome, ev.target.value)} />
      </Campo>
    );
  };
  return (
    <div className="grid grid-cols-1 b:grid-cols-2 c:grid-cols-3 gap-espaco-lg">
      <Campo rotulo={FRASES_UP["up.av.tom"]} id="up-key">
        <Selecao id="up-key" testid="campo-tom" valor={tom} opcoes={TONS_UP} escolha={FRASES_UP["up.av.escolha"]} meta onMudar={(v) => onChange("key", v)} />
      </Campo>
      {entrada("bpm")}
      <Campo rotulo={FRASES_UP["up.av.dificuldade"]} id="up-difficulty">
        <Selecao id="up-difficulty" testid="campo-dificuldade" valor={difficulty} opcoes={DIFICULDADES} escolha={FRASES_UP["up.av.escolha"]} meta onMudar={(v) => onChange("difficulty", v)} />
      </Campo>
      {entrada("capo")}
      {entrada("tuning")}
      {entrada("timeSignature")}
      <div className="col-span-full">
        <CaixaDeMarcar rotulo={FRASES_UP["up.av.favorita"]} marcado={isFavorite} onMudar={(v) => onChange("isFavorite", v)} />
      </div>
    </div>
  );
}
