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
    // I1-PR-12 (decisão 11 do aval): o erro leva o `status` (aditivo) — sem token é 401, como no `updateContent`
    throw Object.assign(new Error(error || "Authentication required to upload files"), { status: 401 });
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
    // I1-PR-12: o `status` e os `details` do contrato (aditivos) — é por eles que a tela reconhece o limite de tamanho
    throw Object.assign(new Error(data?.error || `Upload failed with status ${response.status}`), {
      status: response.status,
      details: data?.details,
    });
  }

  const result = await response.json();
  if (!result.url) {
    throw Object.assign(new Error("Failed to get public URL for uploaded file"), { status: 500 });
  }
  return result.url;
}
