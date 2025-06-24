import withPWA from 'next-pwa'
import runtimeCaching from 'next-pwa/cache.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
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
