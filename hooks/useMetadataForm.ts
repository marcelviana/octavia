import { useState } from "react";
import { useAuth } from "@/contexts/firebase-auth-context";
import { createContent } from "@/lib/content-service";

interface MetadataFormData {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  notes: string;
  key: string;
  bpm: string;
  difficulty: string;
  capo: string;
  tuning: string;
  timeSignature: string;
  isFavorite: boolean;
  tags: string[];
}

interface UseMetadataFormProps {
  onComplete: (metadata: any) => void | Promise<void>;
  initialData?: Partial<MetadataFormData>;
}

export function useMetadataForm({ onComplete, initialData }: UseMetadataFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // I1-PR-12: a falha do salvar é o ERRO como veio (com o `status`); a frase é da tela, pela espécie
  // (`components/upload/falhas-do-upload.ts`). Eram duas strings cruas em inglês (`error`, `success`); o sucesso
  // (*"Content saved successfully!"*) piscava junto com o pronto — a mesma notícia, uma frase só (nota de `UP-pronto`).
  const [falha, setFalha] = useState<unknown>(null);

  const [formData, setFormData] = useState<MetadataFormData>({
    title: initialData?.title || "",
    artist: initialData?.artist || "",
    album: initialData?.album || "",
    genre: initialData?.genre || "",
    year: initialData?.year || "",
    notes: initialData?.notes || "",
    key: initialData?.key || "",
    bpm: initialData?.bpm || "",
    difficulty: initialData?.difficulty || "",
    capo: initialData?.capo || "",
    tuning: initialData?.tuning || "Standard (EADGBE)",
    timeSignature: initialData?.timeSignature || "4/4",
    isFavorite: initialData?.isFavorite || false,
    tags: initialData?.tags || []
  });

  const updateField = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFalha(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      setFalha(Object.assign(new Error("User not authenticated"), { status: 401 }));
      return;
    }

    // sem título ou artista o *Salvar* já está inativo, com o motivo ao lado (`UP-detalhes-inativo`)
    if (!formData.title || !formData.artist) {
      return;
    }

    setIsSubmitting(true);
    setFalha(null);

    try {
      const metadata = {
        title: formData.title,
        artist: formData.artist,
        album: formData.album || null,
        genre: formData.genre || null,
        year: formData.year ? parseInt(formData.year) : null,
        notes: formData.notes || null,
        key: formData.key || null,
        bpm: formData.bpm ? parseInt(formData.bpm) : null,
        difficulty: formData.difficulty || null,
        capo: formData.capo ? parseInt(formData.capo) : null,
        tuning: formData.tuning || null,
        time_signature: formData.timeSignature || null,
        is_favorite: formData.isFavorite,
        tags: formData.tags.length > 0 ? formData.tags : null
      };

      // ADD-14/ADD-01: o save é AGUARDADO — o `isSubmitting` só libera depois
      // que ele conclui de verdade (antes, o onComplete async não era aguardado
      // e o `disabled={isSubmitting}` do botão liberava no mesmo tick, deixando
      // o save em voo desprotegido).
      await onComplete(metadata);
    } catch (err) {
      setFalha(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    falha,
    updateField,
    handleSubmit
  };
}