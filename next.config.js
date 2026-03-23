/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,

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
      // NOTE: OG image caching is handled in netlify.toml to avoid header conflicts
      // The netlify.toml headers take precedence and are more reliable
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
