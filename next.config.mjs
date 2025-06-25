import withPWA from 'next-pwa'
import runtimeCaching from 'next-pwa/cache.js'

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
    // Add any remote domains if needed in the future
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle PDF.js worker
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
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
  fallbacks: {
    document: '/_offline',
  },
})(nextConfig)

export default withPWANextConfig
