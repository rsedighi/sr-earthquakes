import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('WebSocket upgrade required', { status: 426 });
  }

  const stub = env.EARTHQUAKE_ROOM.getByName('global');
  return stub.fetch(request);
};
