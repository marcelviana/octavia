import logger from "@/lib/logger"

let pdfjsLib: any = null;
let workerConfigured = false;

async function initializePdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
  }
  
  if (!workerConfigured && typeof window !== 'undefined') {
    try {
      // Use local worker file from public directory
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      workerConfigured = true;
      
      logger.log('PDF.js worker configured with local source: /pdf.worker.min.mjs');
    } catch (error) {
      logger.warn('Failed to configure PDF.js worker:', error);
      throw new Error('PDF.js worker configuration failed');
    }
  }
  
  return pdfjsLib;
}

export async function getPdfDocument(data: ArrayBuffer) {
  const pdfLib = await initializePdfJs();
  return pdfLib.getDocument({ data }).promise;
}

export { initializePdfJs }; 