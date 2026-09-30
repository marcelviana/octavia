"use client";

/**
 * A zona de arquivo (I1-PR-12; folha `7-upload`: `UP-arquivo`, `-enviando`, `-extensao`, `-limite`, `-envio-rede`,
 * `-envio-servidor`, `-lote-vazio`): altura mínima `web.zonaArquivo`, tracejado `lineInfo` (ou `errorInk` na extensão
 * recusada), *arraste o arquivo para cá*, *Escolher arquivo* e a linha dos formatos — com o limite REAL, o do servidor
 * (I1-D29; antes, *"(max 50MB)"*). O envio é o de antes (`uploadToStorage`, o mesmo `FormData`). O que mudou:
 * - a extensão recusada fica sob a zona (era toast); o cliente segue sem cobrar tamanho (decisão 11 do aval);
 * - a falha do envio é a linha da tela, pela espécie: o limite (413, ou 400 de `field: "size"` — N8), sem ação; rede e
 *   5xx com *Tentar de novo*, que repete o MESMO envio (o mesmo arquivo); 401, 429 e o outro 400, sem ação (era toast);
 * - a falha da LEITURA do lote (nenhuma música; o arquivo não se leu) é a mesma linha, aqui — antes, um alerta no passo 1.
 */
import { useRef, useState } from "react";
import { uploadToStorage, type UploadedFile } from "./upload-to-storage";
import { ContentType } from "@/types/content";
import { CONTROLE_LISTA } from "@/components/identidade/controles";
import { LinhaDaTela, type FalhaDaTela } from "@/components/identidade/linha-da-tela";
import { BotaoDoPasso, Botoes, Validacao } from "@/components/upload/pecas";
import { linhaDoEnvio } from "@/components/upload/falhas-do-upload";
import { EXTENSOES_PARTITURA, EXTENSOES_TEXTO, FRASES_UP, LIMITE_MIB, fraseUp, linhaDoArquivo, listaDeExtensoes } from "@/components/upload/frases-upload";

interface FileUploadZoneProps {
  contentType: ContentType;
  onFilesUploaded: (files: UploadedFile[]) => void;
  onVoltar: () => void;
  /** a falha da leitura do lote (`useAddContentLogic`): nenhuma música, ou o arquivo não se leu */
  falhaDoLote: "vazio" | "ler" | null;
  onLerDeNovo: () => void;
}

export function FileUploadZone({ contentType, onFilesUploaded, onVoltar, falhaDoLote, onLerDeNovo }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [enviando, setEnviando] = useState<File | null>(null);
  const [recusado, setRecusado] = useState<string | null>(null);
  const [falha, setFalha] = useState<FalhaDaTela | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const extensoes = contentType === ContentType.SHEET ? EXTENSOES_PARTITURA : EXTENSOES_TEXTO;

  const enviar = async (file: File) => {
    setEnviando(file);
    setFalha(null);
    try {
      const url = await uploadToStorage(file);
      onFilesUploaded([{ id: Date.now(), name: file.name, size: file.size, type: file.type, contentType, file, url }]);
    } catch (err) {
      setFalha(linhaDoEnvio(err, () => void enviar(file)));
    } finally {
      setEnviando(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (!file || enviando) return;
    setFalha(null);
    if (!extensoes.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setRecusado(fraseUp("up.extensao", { nome: file.name, lista: listaDeExtensoes(extensoes, true) }));
      return;
    }
    setRecusado(null);
    void enviar(file);
  };

  const doLote: FalhaDaTela | null =
    falhaDoLote === "vazio" ? { tipo: "falha", motivo: FRASES_UP["up.lote.vazio"] }
    : falhaDoLote === "ler" ? { tipo: "falha", motivo: FRASES_UP["up.lote.ler"], onTentar: onLerDeNovo }
    : null;

  return (
    <>
      <LinhaDaTela falha={falha ?? (enviando || recusado ? null : doLote)} rotuloTentar={FRASES_UP["acao.tentar"]} />
      <div
        data-testid="zona-arquivo"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); }}
        className={`min-h-web-zona-arquivo rounded-raio-control border-hairline border-dashed flex flex-col items-center justify-center gap-espaco-lg p-espaco-xxl text-center ${recusado ? "border-cor-error-ink" : isDragOver ? "border-cor-accent-ink" : "border-cor-line-info"}`}
      >
        <p className="font-fam-display font-peso-display text-tam-button tracking-display uppercase leading-natural">
          {enviando ? FRASES_UP["up.enviando"] : FRASES_UP["up.zona"]}
        </p>
        {!enviando && (
          <button type="button" aria-label={FRASES_UP["up.escolher.nome"]} onClick={() => inputRef.current?.click()} className={`${CONTROLE_LISTA} border-cor-line-info`}>
            {FRASES_UP["up.escolher"]}
          </button>
        )}
        <p className="text-tam-label text-cor-muted break-words max-w-full">
          {enviando ? linhaDoArquivo(enviando.name, enviando.size) : fraseUp("up.formatos", { lista: listaDeExtensoes(extensoes), n: LIMITE_MIB })}
        </p>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={extensoes.join(",")}
          disabled={!!enviando}
          onChange={(e) => { if (e.target.files) handleFiles(Array.from(e.target.files)); }}
        />
      </div>
      {recusado && <Validacao frase={recusado} />}
      <Botoes aDireita={false}>
        <BotaoDoPasso rotulo={FRASES_UP["acao.voltar"]} icone="voltar" onClick={onVoltar} />
      </Botoes>
    </>
  );
}
