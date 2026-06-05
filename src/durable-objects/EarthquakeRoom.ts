/**
 * EarthquakeRoom — single global Durable Object that fans out new earthquake
 * events to all connected WebSocket clients in real-time.
 *
 * Clients connect via GET /api/ws/earthquakes (WebSocket upgrade).
 * The cron worker (Sprint 4) sends messages by calling:
 *   env.EARTHQUAKE_ROOM.getByName('global').broadcast(payload)
 */
import { DurableObject } from 'cloudflare:workers';

interface Env {
  EARTHQUAKE_ROOM: DurableObjectNamespace;
}

interface Session {
  webSocket: WebSocket;
  quit: boolean;
}

export class EarthquakeRoom extends DurableObject<Env> {
  private sessions: Set<Session> = new Set();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('ping', 'pong'),
    );
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Internal endpoint: cron worker POSTs new earthquake events here
    if (request.method === 'POST' && url.pathname === '/broadcast') {
      const payload = await request.json();
      this.broadcast(payload);
      return new Response('ok');
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);

    const session: Session = { webSocket: server, quit: false };
    this.sessions.add(session);

    server.addEventListener('close', () => {
      session.quit = true;
      this.sessions.delete(session);
    });

    server.addEventListener('error', () => {
      session.quit = true;
      this.sessions.delete(session);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (message === 'ping') ws.send('pong');
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    for (const session of this.sessions) {
      if (session.webSocket === ws) {
        session.quit = true;
        this.sessions.delete(session);
        break;
      }
    }
  }

  broadcast(payload: unknown): void {
    const msg = JSON.stringify(payload);
    for (const session of this.sessions) {
      if (!session.quit) {
        try {
          session.webSocket.send(msg);
        } catch {
          session.quit = true;
          this.sessions.delete(session);
        }
      }
    }
  }
}
