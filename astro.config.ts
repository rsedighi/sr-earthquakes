import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    workerEntryPoint: {
      path: './src/worker.ts',
      namedExports: ['EarthquakeRoom', 'CommentRoom'],
    },
  }),
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'next/link': path.resolve(__dirname, './src/lib/shims/next-link.tsx'),
        'next/image': path.resolve(__dirname, './src/lib/shims/next-image.tsx'),
        'next/dynamic': path.resolve(__dirname, './src/lib/shims/next-dynamic.tsx'),
        'next/navigation': path.resolve(__dirname, './src/lib/shims/next-navigation.ts'),
      },
    },
    ssr: {
      external: [],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
  },
});
