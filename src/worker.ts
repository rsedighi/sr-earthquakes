// Custom Cloudflare worker entrypoint.
// Wraps the default @astrojs/cloudflare createExports so that the generated
// dist/_worker.js/index.js extracts EarthquakeRoom and CommentRoom from the
// return value (which is where the generated code looks, via _exports['...'])
import { createExports as _createExports } from '@astrojs/cloudflare/entrypoints/server.js';
import { EarthquakeRoom } from './durable-objects/EarthquakeRoom';
import { CommentRoom } from './durable-objects/CommentRoom';

export { EarthquakeRoom, CommentRoom };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createExports(manifest: any) {
  return {
    ..._createExports(manifest),
    EarthquakeRoom,
    CommentRoom,
  };
}
