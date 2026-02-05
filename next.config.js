/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set output file tracing root to silence the warning
  outputFileTracingRoot: process.cwd(),

  // Ensure consistent compression behavior
  compress: true,

  // Allow Amazon product images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'ws-na.amazon-adsystem.com',
        pathname: '/**',
      },
    ],
  },

  // Configure headers for better cache control
  async headers() {
    return [
      {
        // OpenGraph images - aggressive caching (earthquake data is immutable)
        // These are fetched by social platform crawlers (Twitter, Facebook, iMessage)
        // Caching here is critical for fast rich card previews when sharing
        source: '/earthquake/:id/opengraph-image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=604800',
          },
        ],
      },
      {
        // Twitter images - same aggressive caching
        source: '/earthquake/:id/twitter-image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=604800',
          },
        ],
      },
      {
        // HTML pages - short cache, force revalidation
        // This prevents stale browser tabs from serving outdated content
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        // Dynamic pages - short cache
        source: '/:path((?!_next|api|favicon|.*\\..*).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        // API routes - no caching
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        // Static assets - long cache, immutable (hashed filenames)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Data prefetch requests - short cache
        source: '/_next/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
