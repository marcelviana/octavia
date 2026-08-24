import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/firebase-auth-context";
import { createContent } from "@/lib/content-service";
import { parseDocxFile, parsePdfFile, parseTextFile, type ParsedSong } from "@/lib/batch-import";
import { ContentType } from "@/types/content";
import type { Database } from "@/types/database.types";

type Content = Database["public"]["Tables"]["content"]["Row"];

interface UploadedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  contentType: string;
  file: File;
  url?: string;
}

interface DraftContent {
  title: string;
  artist: string;
  contentType: string;
  content_data: string;
}

type CreatedContent = DraftContent | Content;

export function useAddContentLogic() {
  const [mode, setMode] = useState<"create" | "import">("create");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [createdContent, setCreatedContent] = useState<CreatedContent | CreatedContent[] | null>(null);
  const [parsedSongs, setParsedSongs] = useState<(ParsedSong & { artist: string; include: boolean })[]>([]);
  const [importMode, setImportMode] = useState<"single" | "batch">("single");
  const [contentType, setContentType] = useState(ContentType.LYRICS);
  const [batchArtist, setBatchArtist] = useState("");
  const [batchImported, setBatchImported] = useState(false);
  const [metadata, setMetadata] = useState<any>({});
  const [draftContent, setDraftContent] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAutoDetectingContentType = useRef(false);
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    if (isAutoDetectingContentType.current) {
      isAutoDetectingContentType.current = false;
      return;
    }

    // Reset all form state when content type changes
    setUploadedFile(null);
    setCurrentStep(1);
    setIsProcessing(false);
    setIsParsing(false);
    setCreatedContent(null);
    setParsedSongs([]);
    setBatchArtist("");
    setBatchImported(false);
    setError(null);

    // Set mode and import mode based on content type
    if (contentType === ContentType.SHEET) {
      setMode("import");
      setImportMode("single");
    } else {
      setMode("create");
      setImportMode("single");
    }
  }, [contentType]);

  // Reset createdContent when switching between create and import modes
  useEffect(() => {
    setCreatedContent(null);
    setError(null);
  }, [mode]);

  const importModes = [
    {
      id: "single",
      name: "Single Content",
      subtitle: "Import a file with a single song.",
    },
    {
      id: "batch",
      name: "Batch Import",
      subtitle: "Import multiple songs from one file.",
    },
  ];

  const availableImportModes =
    contentType === ContentType.SHEET
      ? importModes.filter((m) => m.id === "single")
      : importModes;

  const contentTypes = [
    { id: "lyrics", name: ContentType.LYRICS },
    { id: "chords", name: ContentType.CHORDS },
    { id: "tabs", name: ContentType.TAB },
    {
      id: "sheet",
      name: ContentType.SHEET,
      tooltip: "Add Sheet Music by uploading PDF or image files. Manual creation is not available for this type.",
    },
  ];

  const handleFilesUploaded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      const file = files[0];
      if (!file) return;

      // Auto-detect if this is an image file and set content type to Sheet Music
      const isImageFile = /\.(png|jpg|jpeg)$/i.test(file.name);
      if (isImageFile && contentType !== ContentType.SHEET) {
        isAutoDetectingContentType.current = true;
        setContentType(ContentType.SHEET);
      }

      setUploadedFile(file);
      setError(null);

      // For sheet music, go directly to step 2
      if (contentType === ContentType.SHEET) {
        setCurrentStep(2);
      } else if (importMode === "batch") {
        handleBatchParsing(file);
      } else {
        setCurrentStep(2);
      }
    }
  };

  const handleBatchParsing = async (file: UploadedFile) => {
    setIsParsing(true);
    setError(null);

    try {
      let songs: ParsedSong[] = [];

      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        songs = await parseDocxFile(file.file);
      } else if (file.type === "application/pdf") {
        songs = await parsePdfFile(file.file);
      } else if (file.type === "text/plain") {
        songs = await parseTextFile(file.file);
      }

      if (songs.length === 0) {
        throw new Error("No songs found in the file");
      }

      const songsWithArtist = songs.map((song, index) => ({
        ...song,
        artist: batchArtist || "Unknown Artist",
        include: true,
        id: index,
      }));

      setParsedSongs(songsWithArtist);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveContent = async (customMetadata?: any) => {
    if (!user) return;

    // ADD-14: guarda de in-flight. Defesa em profundidade — o formulário já
    // aguarda o save (useMetadataForm), mas a ref protege o fluxo mesmo se um
    // caller futuro voltar a chamar sem await. Não cobre o replay da fila
    // offline (duplicata por reprocessamento): ver B9 do PLANO-TRANSICAO.
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;

    setIsUploading(true);
    setError(null);

    try {
      if (parsedSongs.length > 0) {
        // Handle batch import
        const songsToImport = parsedSongs.filter(song => song.include);
        const createdSongs: CreatedContent[] = [];

        for (const song of songsToImport) {
          const content = await createContent({
            title: song.title,
            artist: song.artist,
            content_type: contentType,
            content_data: song.body,
            user_id: user.uid
          });
          createdSongs.push(content);
        }

        setCreatedContent(createdSongs);
      } else if (draftContent) {
        // Handle created content from ContentCreator
        const metadataToUse = customMetadata || metadata;
        const content = await createContent({
          title: metadataToUse.title || draftContent.title,
          artist: metadataToUse.artist || "Unknown Artist",
          content_type: draftContent.type,
          content_data: draftContent.content,
          album: metadataToUse.album || null,
          genre: metadataToUse.genre || null,
          notes: metadataToUse.notes || null,
          key: metadataToUse.key || null,
          bpm: metadataToUse.bpm ? parseInt(metadataToUse.bpm) : null,
          difficulty: metadataToUse.difficulty || null,
          time_signature: metadataToUse.timeSignature || null,
          is_favorite: metadataToUse.isFavorite || false,
          tags: metadataToUse.tags || null,
          user_id: user.uid
        });
        setCreatedContent(content);
        return content;
      } else if (uploadedFile) {
        // Handle single file upload
        // ADD-13: este branch lia `metadata` — estado do hook que o formulário
        // nunca preenche — em vez de `customMetadata`, e descartava título,
        // artista e todos os campos avançados (o item 42 da Fase D salvou o
        // filename e "Unknown Artist"). Alinhado ao branch de draft.
        const metadataToUse = customMetadata || metadata;
        const content = await createContent({
          title: metadataToUse.title || uploadedFile.name,
          artist: metadataToUse.artist || "Unknown Artist",
          content_type: contentType,
          file_url: uploadedFile.url ?? uploadedFile.name,
          album: metadataToUse.album || null,
          genre: metadataToUse.genre || null,
          notes: metadataToUse.notes || null,
          key: metadataToUse.key || null,
          // ternário antes do parseInt: string vazia vira null (o schema
          // declara bpm .optional().nullable()), nunca NaN
          bpm: metadataToUse.bpm ? parseInt(metadataToUse.bpm, 10) : null,
          difficulty: metadataToUse.difficulty || null,
          time_signature: metadataToUse.timeSignature || null,
          is_favorite: metadataToUse.isFavorite || false,
          tags: metadataToUse.tags || null,
          user_id: user.uid
        });
        setCreatedContent(content);
        return content;
      }

      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save content");
      throw err;
    } finally {
      saveInFlightRef.current = false;
      setIsUploading(false);
    }
  };

  return {
    mode,
    setMode,
    currentStep,
    setCurrentStep,
    contentType,
    setContentType,
    importMode,
    setImportMode,
    uploadedFile,
    metadata,
    setMetadata,
    parsedSongs,
    draftContent,
    setDraftContent,
    isUploading,
    isProcessing,
    createdContent,
    error,
    handleFilesUploaded,
    handleSaveContent,
    availableImportModes,
    contentTypes
  };
}