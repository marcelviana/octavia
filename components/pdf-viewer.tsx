"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";

import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
  className?: string;
  fullscreen?: boolean;
}

export function PdfViewer({ url, className, fullscreen = false }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const changePage = (offset: number) => {
    setPageNumber((prev) => Math.min(Math.max(prev + offset, 1), numPages));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <div ref={containerRef} className={cn("w-full h-full flex flex-col", className)}>
      <div className="flex items-center justify-between py-2 space-x-2">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} / {numPages || 1}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setScale(Math.max(scale - 0.2, 0.5))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setScale(Math.min(scale + 0.2, 3))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          {fullscreen && (
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto flex justify-center">
        <Document file={url} onLoadSuccess={onDocumentLoadSuccess} loading={<p className="p-4">Loading PDF...</p>} error={<p className="p-4">Unable to display PDF. <a href={url} target="_blank" rel="noopener noreferrer">Download</a></p>}>
          <Page pageNumber={pageNumber} scale={scale} width={800} />
        </Document>
      </div>
    </div>
  );
}

export default PdfViewer;
