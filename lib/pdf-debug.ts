// PDF Debugging Utility
// This module helps identify and troubleshoot PDF loading issues

interface PdfDebugInfo {
  url: string;
  timestamp: number;
  userAgent: string;
  isOnline: boolean;
  cacheStatus: 'cached' | 'network' | 'error';
  error?: string;
  responseTime?: number;
  contentLength?: number;
  contentType?: string;
}

class PdfDebugger {
  private static instance: PdfDebugger;
  private debugLog: PdfDebugInfo[] = [];
  private maxLogSize = 50;

  static getInstance(): PdfDebugger {
    if (!PdfDebugger.instance) {
      PdfDebugger.instance = new PdfDebugger();
    }
    return PdfDebugger.instance;
  }

  logPdfLoad(info: Omit<PdfDebugInfo, 'timestamp' | 'userAgent'>) {
    const debugInfo: PdfDebugInfo = {
      ...info,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    this.debugLog.push(debugInfo);
    
    // Keep log size manageable
    if (this.debugLog.length > this.maxLogSize) {
      this.debugLog.shift();
    }

    console.log('[PDF Debug]', debugInfo);
  }

  async testPdfUrl(url: string): Promise<{
    success: boolean;
    error?: string;
    responseTime?: number;
    contentLength?: number;
    contentType?: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('[PDF Debug] Testing URL:', url);
      
      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to avoid downloading the full file
        cache: 'no-cache', // Force network request
      });

      const responseTime = Date.now() - startTime;
      const contentLength = response.headers.get('Content-Length');
      const contentType = response.headers.get('Content-Type');

      if (!response.ok) {
        const error = `HTTP ${response.status}: ${response.statusText}`;
        this.logPdfLoad({
          url,
          isOnline: navigator.onLine,
          cacheStatus: 'error',
          error,
          responseTime,
          contentLength: contentLength ? parseInt(contentLength) : undefined,
          contentType: contentType || undefined,
        });
        return { success: false, error, responseTime };
      }

      this.logPdfLoad({
        url,
        isOnline: navigator.onLine,
        cacheStatus: 'network',
        responseTime,
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        contentType: contentType || undefined,
      });

      return {
        success: true,
        responseTime,
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        contentType: contentType || undefined,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logPdfLoad({
        url,
        isOnline: navigator.onLine,
        cacheStatus: 'error',
        error: errorMessage,
        responseTime,
      });

      return { success: false, error: errorMessage, responseTime };
    }
  }

  getDebugLog(): PdfDebugInfo[] {
    return [...this.debugLog];
  }

  clearDebugLog(): void {
    this.debugLog = [];
  }

  generateDebugReport(): string {
    const totalAttempts = this.debugLog.length;
    const successfulLoads = this.debugLog.filter(log => log.cacheStatus !== 'error').length;
    const failedLoads = this.debugLog.filter(log => log.cacheStatus === 'error').length;
    const avgResponseTime = this.debugLog.reduce((sum, log) => sum + (log.responseTime || 0), 0) / totalAttempts;

    const report = `
PDF Loading Debug Report
=======================
Total Attempts: ${totalAttempts}
Successful Loads: ${successfulLoads}
Failed Loads: ${failedLoads}
Success Rate: ${((successfulLoads / totalAttempts) * 100).toFixed(1)}%
Average Response Time: ${avgResponseTime.toFixed(0)}ms

Recent Errors:
${this.debugLog
  .filter(log => log.error)
  .slice(-5)
  .map(log => `- ${new Date(log.timestamp).toLocaleTimeString()}: ${log.error} (${log.url.substring(0, 50)}...)`)
  .join('\n')}

Full Log:
${this.debugLog
  .slice(-10)
  .map(log => `${new Date(log.timestamp).toLocaleTimeString()} | ${log.cacheStatus} | ${log.responseTime || 'N/A'}ms | ${log.url.substring(0, 50)}...`)
  .join('\n')}
    `.trim();

    return report;
  }
}

export const pdfDebugger = PdfDebugger.getInstance();

// Utility function to test PDF URLs
export async function debugPdfUrl(url: string): Promise<void> {
  console.log('[PDF Debug] Starting debug for URL:', url);
  
  // Test the URL
  const result = await pdfDebugger.testPdfUrl(url);
  
  if (result.success) {
    console.log('[PDF Debug] ✅ URL test successful:', {
      responseTime: result.responseTime,
      contentLength: result.contentLength,
      contentType: result.contentType,
    });
  } else {
    console.error('[PDF Debug] ❌ URL test failed:', result.error);
  }
  
  // Generate and log debug report
  console.log('[PDF Debug] Debug Report:\n', pdfDebugger.generateDebugReport());
}

// Utility function to check if a URL is likely a valid PDF
export function isValidPdfUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    // Check if it ends with .pdf
    if (pathname.endsWith('.pdf')) {
      return true;
    }
    
    // Check if it's a blob URL (from our cache)
    if (url.startsWith('blob:')) {
      return true;
    }
    
    // Check if it's a data URL with PDF content type
    if (url.startsWith('data:application/pdf')) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

// Export for use in components
export { PdfDebugger }; 