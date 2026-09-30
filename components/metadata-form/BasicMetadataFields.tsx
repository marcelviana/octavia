"use client";

/**
 * Os campos do formulário de detalhes (I1-PR-12; folha `7-upload`, `UP-detalhes`): Título \* · Artista \* · Álbum ·
 * Gênero · Ano em duas colunas (uma em B e A) e as *Notas* (duas linhas) na largura toda. Os valores que sobem são os
 * de antes.
 */
import { Campo, CAMPO_DE_DUAS_LINHAS, campoDeUmaLinha } from "@/components/upload/pecas";
import { FRASES_UP, type ChaveUp } from "@/components/upload/frases-upload";

interface BasicMetadataFieldsProps {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  notes: string;
  onChange: (field: string, value: string) => void;
}

type Nome = "title" | "artist" | "album" | "genre" | "year";
const CAMPOS: readonly { nome: Nome; testid: string; rotulo: ChaveUp; exemplo: ChaveUp; numero?: boolean }[] = [
  { nome: "title", testid: "campo-titulo", rotulo: "up.meta.titulo", exemplo: "up.meta.titulo.exemplo" },
  { nome: "artist", testid: "campo-artista", rotulo: "up.meta.artista", exemplo: "up.meta.artista.exemplo" },
  { nome: "album", testid: "campo-album", rotulo: "up.meta.album", exemplo: "up.meta.album.exemplo" },
  { nome: "genre", testid: "campo-genero", rotulo: "up.meta.genero", exemplo: "up.meta.genero.exemplo" },
  { nome: "year", testid: "campo-ano", rotulo: "up.meta.ano", exemplo: "up.meta.ano.exemplo", numero: true },
];

export function BasicMetadataFields({ notes, onChange, ...valores }: BasicMetadataFieldsProps) {
  return (
    <div className="grid grid-cols-1 c:grid-cols-2 gap-espaco-lg">
      {CAMPOS.map((c) => (
        <Campo key={c.nome} rotulo={FRASES_UP[c.rotulo]} id={`up-${c.nome}`}>
          <input id={`up-${c.nome}`} data-testid={c.testid} type={c.numero ? "number" : "text"} value={valores[c.nome]}
            placeholder={FRASES_UP[c.exemplo]} className={campoDeUmaLinha()} onChange={(e) => onChange(c.nome, e.target.value)} />
        </Campo>
      ))}
      <Campo rotulo={FRASES_UP["up.meta.notas"]} id="up-notes" largo>
        <textarea id="up-notes" data-testid="campo-notas" value={notes} placeholder={FRASES_UP["up.meta.notas.exemplo"]}
          className={CAMPO_DE_DUAS_LINHAS} onChange={(e) => onChange("notes", e.target.value)} />
      </Campo>
    </div>
  );
}
