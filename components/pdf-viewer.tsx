"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  StretchHorizontal,
  StretchVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Use local worker to avoid cross-origin issues in production
try {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
} catch (error) {
  // Fallback to local worker file
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

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
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    console.log("PDF loaded successfully with", numPages, "pages");
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
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

  const fitWidth = () => {
    if (containerSize.width) {
      setScale(containerSize.width / 800);
    }
  };

  const fitPage = () => {
    if (containerSize.height) {
      setScale(containerSize.height / 1000);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      window.removeEventListener("resize", updateSize);
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
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
          <Button variant="ghost" size="sm" onClick={fitWidth} title="Fit width">
            <StretchHorizontal className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={fitPage} title="Fit page">
            <StretchVertical className="w-4 h-4" />
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
        <Document 
          file={url} 
          onLoadSuccess={onDocumentLoadSuccess} 
          onLoadError={onDocumentLoadError}
          loading={<p className="p-4">Loading PDF...</p>} 
          error={<p className="p-4">Unable to display PDF. <a href={url} target="_blank" rel="noopener noreferrer">Download</a></p>}
        >
          <Page pageNumber={pageNumber} scale={scale} width={800} />
        </Document>
      </div>
    </div>
  );
}

export default PdfViewer;
