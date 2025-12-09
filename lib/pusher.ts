import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (pusherServer) return pusherServer;
  
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;
  
  if (!appId || !key || !secret || !cluster) {
    console.warn('Pusher server credentials not found. Real-time features will be disabled.');
    return null;
  }
  
  pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
  
  return pusherServer;
}

// Client-side Pusher instance
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === 'undefined') return null;
  if (pusherClient) return pusherClient;
  
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  
  if (!key || !cluster) {
    console.warn('Pusher client credentials not found. Real-time features will be disabled.');
    return null;
  }
  
  pusherClient = new PusherClient(key, {
    cluster,
  });
  
  return pusherClient;
}

// Channel naming convention
export function getEarthquakeChannel(earthquakeId: string): string {
  return `earthquake-${earthquakeId}`;
}

// Event types
export const PUSHER_EVENTS = {
  NEW_COMMENT: 'new-comment',
  COMMENT_UPDATED: 'comment-updated',
  COMMENT_DELETED: 'comment-deleted',
} as const;

