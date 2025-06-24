"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Music } from "lucide-react"

interface AnnotationToolsProps {
  content: any
  annotations: any[]
  selectedTool: string
  zoom: number
  onAnnotationsChange: (annotations: any[]) => void
  onContentChange: (content: any) => void
}

export function AnnotationTools({
  content,
  annotations,
  selectedTool,
  zoom,
  onAnnotationsChange,
  onContentChange,
}: AnnotationToolsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<any[]>([])
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, text: "" })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw annotations
    annotations.forEach((annotation) => {
      switch (annotation.type) {
        case "pen":
          ctx.strokeStyle = annotation.color || "#000000"
          ctx.lineWidth = annotation.width || 2
          ctx.beginPath()
          annotation.path.forEach((point: any, index: number) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y)
            } else {
              ctx.lineTo(point.x, point.y)
            }
          })
          ctx.stroke()
          break
        case "highlighter":
          ctx.globalAlpha = 0.3
          ctx.strokeStyle = annotation.color || "#ffff00"
          ctx.lineWidth = annotation.width || 10
          ctx.beginPath()
          annotation.path.forEach((point: any, index: number) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y)
            } else {
              ctx.lineTo(point.x, point.y)
            }
          })
          ctx.stroke()
          ctx.globalAlpha = 1
          break
        case "text":
          ctx.fillStyle = annotation.color || "#000000"
          ctx.font = `${annotation.fontSize || 16}px Arial`
          ctx.fillText(annotation.text, annotation.x, annotation.y)
          break
        case "circle":
          ctx.strokeStyle = annotation.color || "#000000"
          ctx.lineWidth = annotation.width || 2
          ctx.beginPath()
          ctx.arc(annotation.x, annotation.y, annotation.radius, 0, 2 * Math.PI)
          ctx.stroke()
          break
        case "square":
          ctx.strokeStyle = annotation.color || "#000000"
          ctx.lineWidth = annotation.width || 2
          ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height)
          break
      }
    })
  }, [annotations])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    switch (selectedTool) {
      case "pen":
      case "highlighter":
        setIsDrawing(true)
        setCurrentPath([pos])
        break
      case "text":
        setTextInput({ show: true, x: pos.x, y: pos.y, text: "" })
        break
      case "circle":
        const newCircle = {
          type: "circle",
          x: pos.x,
          y: pos.y,
          radius: 20,
          color: "#000000",
          width: 2,
        }
        onAnnotationsChange([...annotations, newCircle])
        break
      case "square":
        const newSquare = {
          type: "square",
          x: pos.x,
          y: pos.y,
          width: 40,
          height: 40,
          color: "#000000",
          strokeWidth: 2,
        }
        onAnnotationsChange([...annotations, newSquare])
        break
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const pos = getMousePos(e)
    setCurrentPath((prev) => [...prev, pos])
  }

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 0) {
      const newAnnotation = {
        type: selectedTool,
        path: currentPath,
        color: selectedTool === "highlighter" ? "#ffff00" : "#000000",
        width: selectedTool === "highlighter" ? 10 : 2,
      }
      onAnnotationsChange([...annotations, newAnnotation])
      setCurrentPath([])
    }
    setIsDrawing(false)
  }

  const handleTextSubmit = () => {
    if (textInput.text.trim()) {
      const newTextAnnotation = {
        type: "text",
        x: textInput.x,
        y: textInput.y,
        text: textInput.text,
        color: "#000000",
        fontSize: 16,
      }
      onAnnotationsChange([...annotations, newTextAnnotation])
    }
    setTextInput({ show: false, x: 0, y: 0, text: "" })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0 relative">
          <div
            className="relative overflow-auto bg-white"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
          >
            {/* Background content (sheet music image) */}
            {content.thumbnail ? (
              <Image
                src={content.thumbnail}
                alt="Sheet music"
                width={600}
                height={800}
                className="w-full h-auto"
                draggable={false}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            ) : (
              <div className="w-full h-[800px] bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Music className="w-8 h-8" />
                  </div>
                  <p>No sheet music image available</p>
                </div>
              </div>
            )}

            {/* Annotation canvas overlay */}
            <canvas
              ref={canvasRef}
              width={600}
              height={800}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            {/* Text input overlay */}
            {textInput.show && (
              <div
                className="absolute bg-F2EDE5 border border-gray-300 rounded p-2 shadow-lg"
                style={{ left: textInput.x, top: textInput.y }}
              >
                <Input
                  value={textInput.text}
                  onChange={(e) => setTextInput((prev) => ({ ...prev, text: e.target.value }))}
                  onKeyPress={(e) => e.key === "Enter" && handleTextSubmit()}
                  onBlur={handleTextSubmit}
                  placeholder="Enter text..."
                  autoFocus
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Annotation List */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Annotations ({annotations.length})</h3>
          <div className="space-y-2 max-h-40 overflow-auto">
            {annotations.map((annotation, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-F2EDE5 rounded">
                <span className="text-sm">
                  {annotation.type === "text" ? `Text: "${annotation.text}"` : annotation.type}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newAnnotations = annotations.filter((_, i) => i !== index)
                    onAnnotationsChange(newAnnotations)
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
