import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function urlHasExtension(url: string, ext: string): boolean {
  const clean = url.split('?')[0].split('#')[0]
  return clean.toLowerCase().endsWith(ext.toLowerCase())
}
