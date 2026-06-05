import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals, params }) => {
  const { env } = locals.runtime;
  const quakeId = params.id;

  if (!quakeId) {
    return new Response('Missing earthquake id', { status: 400 });
  }

  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('WebSocket upgrade required', { status: 426 });
  }

  const stub = env.COMMENT_ROOM.getByName(quakeId);
  return stub.fetch(request);
};
