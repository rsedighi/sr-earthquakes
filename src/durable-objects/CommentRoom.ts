/**
 * CommentRoom — one Durable Object instance per earthquake (keyed by quakeId).
 * Broadcasts comment create/update/delete events to connected clients.
 *
 * Clients connect via GET /api/ws/comments/[id] (WebSocket upgrade).
 * API routes post comment mutations by calling stub.broadcast(event).
 */
import { DurableObject } from 'cloudflare:workers';

interface Env {
  COMMENT_ROOM: DurableObjectNamespace;
}

export type CommentEvent =
  | { type: 'created';  comment: Record<string, unknown> }
  | { type: 'liked';    commentId: string; likes: number }
  | { type: 'deleted';  commentId: string };

interface Session {
  webSocket: WebSocket;
  quit: boolean;
}

export class CommentRoom extends DurableObject<Env> {
  private sessions: Set<Session> = new Set();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('ping', 'pong'),
    );
  }

  async fetch(request: Request): Promise<Response> {
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

  broadcast(event: CommentEvent): void {
    const msg = JSON.stringify(event);
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
