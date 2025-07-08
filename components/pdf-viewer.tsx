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
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Enhanced PDF worker setup with better error handling
const setupPdfWorker = () => {
  try {
    // Try to use the local worker first
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    console.log("PDF worker set to local build");
  } catch (error) {
    console.warn("Failed to set local PDF worker, using fallback:", error);
    // Fallback to local worker file
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
};

// Initialize worker setup only once
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  setupPdfWorker();
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Enhanced document load success handler
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setHasError(false);
    setErrorMessage("");
    console.log("PDF loaded successfully with", numPages, "pages from URL:", url);
  };

  // Enhanced document load error handler
  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error for URL:", url, error);
    setIsLoading(false);
    setHasError(true);
    
    // Provide more specific error messages for common issues
    let message = error.message || "Failed to load PDF";
    
    if (error.message?.includes("UnexpectedResponseException")) {
      message = "PDF file is corrupted or inaccessible. Please try again.";
    } else if (error.message?.includes("Invalid name")) {
      message = "PDF file format error. Please try again.";
    } else if (error.message?.includes("blob:")) {
      message = "Cached PDF file is corrupted. Please refresh the page.";
    }
    
    setErrorMessage(message);
  };

  // Retry function
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setHasError(false);
    setErrorMessage("");
    setIsLoading(true);
    console.log("Retrying PDF load, attempt:", retryCount + 1);
    
    // If it's a blob URL and we've retried multiple times, suggest refreshing
    if (url.startsWith('blob:') && retryCount >= 2) {
      console.warn("Multiple retries with blob URL, suggesting page refresh");
    }
  };

  // Enhanced page change function
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

  // Reset state when URL changes
  useEffect(() => {
    console.log("PDF viewer URL changed to:", url);
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    setRetryCount(0);
    setPageNumber(1);
    setNumPages(0);
  }, [url]);

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

  // Enhanced loading component
  const LoadingComponent = () => (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p className="text-sm text-gray-600">Loading PDF...</p>
      <p className="text-xs text-gray-400">URL: {url.substring(0, 50)}...</p>
    </div>
  );

  // Enhanced error component
  const ErrorComponent = () => (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">Failed to load PDF</p>
        <p className="text-xs text-gray-500 mt-1">{errorMessage}</p>
        <p className="text-xs text-gray-400 mt-2">URL: {url.substring(0, 50)}...</p>
        {url.startsWith('blob:') && retryCount >= 2 && (
          <p className="text-xs text-amber-600 mt-2">
            💡 Try refreshing the page to reload the cached file
          </p>
        )}
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          className="flex items-center space-x-1"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </Button>
        {!url.startsWith('blob:') && (
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              Download
            </a>
          </Button>
        )}
        {url.startsWith('blob:') && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        )}
      </div>
    </div>
  );

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(Math.min(scale + 0.2, 3))}
          >
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
          loading={<LoadingComponent />} 
          error={<ErrorComponent />}
          key={`${url}-${retryCount}`} // Force re-render on retry
        >
          <Page pageNumber={pageNumber} scale={scale} width={800} />
        </Document>
      </div>
    </div>
  );
}

export default PdfViewer;
