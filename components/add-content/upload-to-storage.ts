import { getValidToken } from "@/lib/auth-manager";

export interface UploadedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  contentType: string;
  file: File;
  url?: string;
}

export function sanitizeFilename(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  const name = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  const extension = lastDot > 0 ? filename.slice(lastDot) : "";
  const sanitized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
  return (sanitized || "file") + extension;
}

export async function uploadToStorage(file: File): Promise<string> {
  const { token, error } = await getValidToken();
  if (!token) {
    throw new Error(error || "Authentication required to upload files");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("filename", sanitizeFilename(file.name));

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || `Upload failed with status ${response.status}`);
  }

  const result = await response.json();
  if (!result.url) {
    throw new Error("Failed to get public URL for uploaded file");
  }
  return result.url;
}
