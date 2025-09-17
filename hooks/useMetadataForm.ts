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
  onComplete: (metadata: any) => void;
}

export function useMetadataForm({ onComplete }: UseMetadataFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<MetadataFormData>({
    title: "",
    artist: "",
    album: "",
    genre: "",
    year: "",
    notes: "",
    key: "",
    bpm: "",
    difficulty: "",
    capo: "",
    tuning: "Standard (EADGBE)",
    timeSignature: "4/4",
    isFavorite: false,
    tags: []
  });

  const updateField = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    if (!formData.title || !formData.artist) {
      setError("Title and Artist are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

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

      setSuccess("Content saved successfully!");
      onComplete(metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save content");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    error,
    success,
    updateField,
    handleSubmit
  };
}