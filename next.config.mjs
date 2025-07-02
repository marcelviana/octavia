import withPWA from 'next-pwa'
import runtimeCaching from './runtime-caching.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin'],
  eslint: {
    // Run ESLint during builds to catch issues
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Fail the build on TypeScript errors
    ignoreBuildErrors: false,
  },
  images: {
    // Enable Next.js image optimization for better performance
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Restrict optimized remote images to known hosts
    remotePatterns: (() => {
      const hosts = new Set()
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (base) {
        try {
          hosts.add(new URL(base).hostname)
        } catch {}
      }
      const extra = process.env.ALLOWED_PROXY_HOSTS?.split(',') || []
      for (const h of extra) {
        const host = h.trim()
        if (host) hosts.add(host)
      }
      return Array.from(hosts).map(hostname => ({ protocol: 'https', hostname }))
    })(),
  },
  webpack: (config, { isServer, dev }) => {
    // Handle PDF.js worker
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        // Completely prevent firebase-admin from being resolved on client-side
        './firebase-admin': false,
        './firebase-admin.js': false,
        './firebase-admin.ts': false,
      };
      
      // Prevent Node.js built-in modules from being bundled on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        util: false,
        url: false,
        buffer: false,
        process: false,
        // Add node: prefixed modules
        'node:process': false,
        'node:stream': false,
        'node:crypto': false,
        'node:util': false,
        'node:url': false,
        'node:buffer': false,
        'node:path': false,
        'node:os': false,
        'node:fs': false,
        'node:net': false,
        'node:tls': false,
      };

      // Externalize firebase-admin and related modules for client-side
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
        'firebase-admin/auth': 'commonjs firebase-admin/auth',
        'firebase-admin/firestore': 'commonjs firebase-admin/firestore',
        'firebase-admin/storage': 'commonjs firebase-admin/storage',
        'google-auth-library': 'commonjs google-auth-library',
        'gcp-metadata': 'commonjs gcp-metadata',
        'google-logging-utils': 'commonjs google-logging-utils',
      });
    }
    
    // Allow loading of PDF.js worker
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?(js|mjs)$/,
      type: "asset/resource",
      generator: {
        filename: "static/worker/[hash][ext][query]",
      },
    });
    
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*\\.(png|jpg|jpeg|webp|svg|gif|ico|woff2?|woff|ttf|eot|otf)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/static/worker/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Content-Type",
            value: "application/javascript",
          },
        ],
      },
      {
        source: "/pdf.worker.min.(js|mjs)",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ]
  },
}

const withPWANextConfig = withPWA({
  dest: 'public',
  runtimeCaching,
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Add cleanup for outdated caches to help with production issues
  cleanupOutdatedCaches: true,
  fallbacks: {
    document: '/_offline',
  },
  additionalManifestEntries: [
    { url: '/library', revision: null },
    { url: '/performance', revision: null },
  ],
  // More aggressive exclude configuration
  exclude: [
    // Default exclusions
    /\.map$/,
    /^manifest.*\.js$/,
    // Exclude all manifest files that commonly cause 404s
    /\/_next\/.*manifest.*\.json$/,
    /\/_next\/server\/.*manifest.*\.js$/,
    /\/_next\/server\/.*manifest.*\.json$/,
    // Exclude specific problematic files
    /\/_next\/build-manifest\.json$/,
    /\/_next\/app-build-manifest\.json$/,
    /\/_next\/react-loadable-manifest\.json$/,
    /\/_next\/prerender-manifest\.json$/,
    /\/_next\/routes-manifest\.json$/,
    // Exclude all server directory content
    /\/_next\/server\//,
    // Function-based exclusion for additional safety
    ({ asset, compilation }) => {
      const name = asset.name;
      // Exclude any file with 'manifest' in the name that might cause issues
      if (name.includes('manifest') && (
        name.includes('.json') || 
        name.includes('/server/') ||
        name.includes('build-manifest') ||
        name.includes('app-build-manifest') ||
        name.includes('middleware')
      )) {
        return true;
      }
      // Exclude all server-side files
      if (name.includes('/server/')) return true;
      return false;
    },
  ],
})(nextConfig)

export default withPWANextConfig
