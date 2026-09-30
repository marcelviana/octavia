import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
// I1-PR-6 (decisão 4): a identidade (custom properties geradas de @octavia/identidade) e as três famílias
import "./styles/identidade.css"
import "./styles/fontes.css"
import "@/lib/logger"
import { FirebaseAuthProvider } from "@/contexts/firebase-auth-context"
import { SessionProvider } from "@/components/providers/session-provider"
import { ErrorBoundary } from "@/lib/error-boundary"
import { getCSPNonce } from "@/lib/csp-nonce"

// Update app/layout.tsx metadata
export const metadata: Metadata = {
  title: "Octavia - Digital Music Management",
  description: "Organize, visualize, and share your musical content",
  generator: "v0.dev",
  icons: {
    icon: "/icons/icon-192x192.webp", // Updated path
    apple: "/icons/icon-192x192.webp",
    shortcut: "/icons/icon-192x192.webp",
  },
}

export const viewport: Viewport = {
  themeColor: "#f59e0b", // Moved from metadata to viewport
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const nonce = await getCSPNonce()
  
  return (
    <html lang="en">
      <head>
        {nonce && (
          <script
            nonce={nonce}
            suppressHydrationWarning={true}
            dangerouslySetInnerHTML={{
              __html: `
                // Apply nonce to Next.js generated inline scripts and styles
                (function() {
                  const nonce = '${nonce}';
                  
                  // Function to add nonce to elements
                  function addNonceToInlineElements() {
                    // Add nonce to inline scripts without src attribute
                    const inlineScripts = document.querySelectorAll('script:not([src]):not([nonce])');
                    inlineScripts.forEach(function(script) {
                      script.setAttribute('nonce', nonce);
                    });
                    
                    // Add nonce to inline styles without href attribute
                    const inlineStyles = document.querySelectorAll('style:not([href]):not([nonce])');
                    inlineStyles.forEach(function(style) {
                      style.setAttribute('nonce', nonce);
                    });
                    
                    // Don't add nonces to elements with style attributes since we've added
                    // the specific CSP hashes that Next.js needs. This prevents hydration mismatches
                    // with React components that don't expect nonces.
                  }
                  
                  // Wait for DOM to be ready before setting up observers
                  function setupNonceObserver() {
                    // Apply nonce immediately for any existing elements
                    addNonceToInlineElements();
                    
                    // Only set up observer if we have the required DOM elements
                    if (document.head && document.body) {
                      // Watch for new elements being added
                      const observer = new MutationObserver(function(mutations) {
                        let hasNewElements = false;
                        mutations.forEach(function(mutation) {
                          // Check for added nodes
                          mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) { // Element node
                              const element = node;
                              if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
                                hasNewElements = true;
                              } else if (element.querySelector) {
                                // Check if any child elements are scripts or styles
                                const childElements = element.querySelectorAll('script, style');
                                if (childElements.length > 0) {
                                  hasNewElements = true;
                                }
                              }
                            }
                          });
                          
                          // No need to watch for style attribute changes since we're not applying nonces to them
                        });
                        
                        if (hasNewElements) {
                          addNonceToInlineElements();
                        }
                      });
                      
                      // Observe both head and body for child additions
                      observer.observe(document.head, { childList: true, subtree: true });
                      observer.observe(document.body, { childList: true, subtree: true });
                    }
                  }
                  
                  // Run setup when DOM is ready
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', setupNonceObserver);
                  } else {
                    // DOM is already ready
                    setupNonceObserver();
                  }
                })();
              `,
            }}
          />
        )}
      </head>
      <body>
        <ErrorBoundary>
          <FirebaseAuthProvider>
            <SessionProvider>{children}</SessionProvider>
          </FirebaseAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
