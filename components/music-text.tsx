"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface MusicTextProps {
  text: string
  className?: string
  monospace?: boolean
}

// very small markdown parser for **bold** and *italic* or __bold__ and _italic_
function parseMarkdown(text: string): string {
  const escapeHtml = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  let html = escapeHtml(text)

  // bold **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>")

  // italic *text* or _text_
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")
  html = html.replace(/_(.+?)_/g, "<em>$1</em>")

  return html
}

export function MusicText({ text, className, monospace = true }: MusicTextProps) {
  const html = parseMarkdown(text)
  return (
    <pre
      className={cn("whitespace-pre-wrap", monospace && "font-mono", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
