// Custom Cloudflare worker entrypoint.
// Extends the default @astrojs/cloudflare server handler with Durable Object
// class exports so wrangler can validate and deploy them in the same bundle.
export { createExports } from '@astrojs/cloudflare/entrypoints/server.js';
export { EarthquakeRoom } from './durable-objects/EarthquakeRoom';
export { CommentRoom } from './durable-objects/CommentRoom';
