"use client";

/**
 * A prévia do lote (I1-PR-12; folha `7-upload`: `UP-lote`, `-lote-importando`, `-lote-erro`; decisão 6 do aval, I1-E24):
 * *{n} músicas encontradas em {arquivo}* e a grade da folha — número (`font.mono` · `size.label` · `muted`) · título ·
 * artista —, MANTENDO o que cada música tinha: o título e o artista editáveis, o corpo editável (duas linhas) e a
 * caixa de incluir. O `POST /api/content` de cada música é o de antes, em série, só das incluídas. O que mudou:
 * - *Importando…* no botão, inativo, durante o envio (era um spinner);
 * - a falha é a linha da tela, pela espécie, com *Tentar de novo* (rede e 5xx) — era um toast indistinto. *Tentar de
 *   novo* repete o importar de antes: numa falha a meio, as que já entraram entram de novo (herança D, não consertada);
 * - o sucesso não é mais toast: quem chama mostra *{n} músicas importadas* no passo 1 (`UP-lote-sucesso`).
 */
import { useState } from "react";
import { createContent } from "@/lib/content-service";
import { ContentType, CONTENT_TYPE_KEYS } from "@/types/content";
import { CaixaDeMarcar } from "@/components/editors/campos";
import { LinhaDaTela, type FalhaDaTela } from "@/components/identidade/linha-da-tela";
import { BotaoDoPasso, Botoes, CAMPO_DE_DUAS_LINHAS, campoDeUmaLinha } from "@/components/upload/pecas";
import { linhaDaEscrita } from "@/components/upload/falhas-do-upload";
import { FRASES_UP, fraseUp, musicasEncontradas } from "@/components/upload/frases-upload";

export interface SongItem {
  title: string;
  body: string;
  artist: string;
  include: boolean;
}

interface BatchPreviewProps {
  songs: SongItem[];
  contentType: ContentType;
  /** o nome do arquivo lido (a frase do topo) */
  arquivo: string;
  onComplete: (contents: unknown[]) => void;
  onBack: () => void;
}

export function BatchPreview({ songs: initialSongs, contentType, arquivo, onComplete, onBack }: BatchPreviewProps) {
  const [songs, setSongs] = useState<SongItem[]>(initialSongs);
  const [isImporting, setIsImporting] = useState(false);
  const [falha, setFalha] = useState<FalhaDaTela | null>(null);
  const mudar = (idx: number, parte: Partial<SongItem>) => setSongs((prev) => prev.map((s, i) => (i === idx ? { ...s, ...parte } : s)));

  const handleImport = async () => {
    const selected = songs.filter((s) => s.include);
    if (selected.length === 0) return;
    setIsImporting(true);
    setFalha(null);
    try {
      const created = [];
      for (const song of selected) {
        const item = await createContent({
          title: song.title,
          artist: song.artist || null,
          content_type: contentType,
          content_data: { [CONTENT_TYPE_KEYS[contentType]]: song.body.trim() },
        } as Parameters<typeof createContent>[0]);
        created.push(item);
      }
      onComplete(created);
    } catch (err) {
      setFalha(linhaDaEscrita("up.lote.erro", err, () => void handleImport()));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <LinhaDaTela falha={falha} rotuloTentar={FRASES_UP["acao.tentar"]} />
      <p className="text-tam-body text-cor-muted break-words">{musicasEncontradas(songs.length, arquivo)}</p>
      <div className="border-hairline border-cor-line rounded-raio-control flex flex-col">
        {songs.map((song, idx) => (
          <div key={idx} className={`flex gap-espaco-lg py-espaco-md px-espaco-xl border-t-hairline ${idx === 0 ? "border-transparent" : "border-cor-line"}`}>
            <div className="h-toque-min shrink-0 flex items-center">
              <div className="font-fam-mono font-peso-mono text-tam-label text-cor-muted">{idx + 1}</div>
            </div>
            <div className="flex-1 min-w-0 grid grid-cols-1 b:grid-cols-2 c:grid-cols-2 gap-x-espaco-lg gap-y-espaco-md">
              <input aria-label={fraseUp("up.lote.titulo", { n: idx + 1 })} value={song.title} className={campoDeUmaLinha()}
                onChange={(e) => mudar(idx, { title: e.target.value })} />
              <input data-testid="campo-lote-artista" aria-label={fraseUp("up.lote.artista", { titulo: song.title })} value={song.artist}
                placeholder={FRASES_UP["up.lote.artista.exemplo"]} className={campoDeUmaLinha()} onChange={(e) => mudar(idx, { artist: e.target.value })} />
              <div className="col-span-full flex flex-col gap-espaco-sm min-w-0">
                <textarea aria-label={fraseUp("up.lote.corpo", { titulo: song.title })} value={song.body}
                  className={`${CAMPO_DE_DUAS_LINHAS} font-fam-mono font-peso-mono whitespace-pre`} onChange={(e) => mudar(idx, { body: e.target.value })} />
                <CaixaDeMarcar rotulo={fraseUp("up.lote.incluir", { titulo: song.title })} marcado={song.include} onMudar={(v) => mudar(idx, { include: v })} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Botoes>
        <BotaoDoPasso rotulo={FRASES_UP["acao.voltar"]} icone="voltar" onClick={onBack} inativo={isImporting} />
        <BotaoDoPasso rotulo={isImporting ? FRASES_UP["up.lote.importando"] : FRASES_UP["up.lote.importar"]} icone="adicionar" escrita
          inativo={isImporting} onClick={() => void handleImport()} />
      </Botoes>
    </>
  );
}
