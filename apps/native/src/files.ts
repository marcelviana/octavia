/**
 * Cache de arquivos do nativo (PRD T1-R14, N0-PR5): baixado direto da `file_url` (bucket público,
 * SEM header de auth), gravado por nome derivado da URL no diretório de cache do app e servido do
 * disco dali em diante — a 2ª abertura não faz request. Sem retry (falha aparece, T1-R37).
 * API nova do expo-file-system (SDK 57): File / Directory / Paths.
 */
import { Directory, File, Paths } from 'expo-file-system'
import { log } from './log'

const filesDir = new Directory(Paths.cache, 'files')

export function fileNameFromUrl(url: string): string {
  return url.split('/').pop() ?? 'file'
}

export function hasFile(url: string): boolean {
  return new File(filesDir, fileNameFromUrl(url)).exists
}

export interface EnsuredFile {
  uri: string
  src: 'disk' | 'download'
  bytes: number
}

export async function ensureFile(url: string): Promise<EnsuredFile> {
  if (!filesDir.exists) filesDir.create()
  const name = fileNameFromUrl(url)
  const file = new File(filesDir, name)
  if (file.exists) {
    const bytes = file.size ?? 0
    log(`file src=disk name=${name} bytes=${bytes}`)
    return { uri: file.uri, src: 'disk', bytes }
  }
  const out = await File.downloadFileAsync(url, file)
  const bytes = out.size ?? 0
  log(`file src=download name=${name} bytes=${bytes}`)
  return { uri: out.uri, src: 'download', bytes }
}

export function clearFiles(): void {
  if (filesDir.exists) filesDir.delete()
  log('files-cleared')
}
