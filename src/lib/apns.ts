/**
 * APNs client — Cloudflare Workers compatible.
 * Uses Web Crypto API (ES256 JWT) and fetch (HTTP/2 via CF network).
 * No Node.js dependencies (no jsonwebtoken, no http2 module).
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function b64url(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlStr(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function importAPNsKey(apnsKeySecret: string): Promise<CryptoKey> {
  // APNS_KEY may be stored as:
  //   (a) base64-encoded PEM file content (most common in CF Secrets)
  //   (b) raw PEM string with headers
  let b64Der: string;
  try {
    const decoded = atob(apnsKeySecret.replace(/\s/g, ''));
    if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
      b64Der = decoded
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/[\n\r\s]/g, '');
    } else {
      b64Der = apnsKeySecret.replace(/\s/g, '');
    }
  } catch {
    b64Der = apnsKeySecret
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/[\n\r\s]/g, '');
  }

  const der = Uint8Array.from(atob(b64Der), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
}

async function makeAPNsJWT(keyId: string, teamId: string, apnsKey: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const header  = b64urlStr(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const payload = b64urlStr(JSON.stringify({ iss: teamId, iat }));
  const input   = `${header}.${payload}`;

  const key = await importAPNsKey(apnsKey);
  // Web Crypto returns P1363 format (64 bytes: R‖S) — exactly what APNs JWT expects
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(input),
  );
  return `${input}.${b64url(new Uint8Array(sig))}`;
}

// ── Distance helper ───────────────────────────────────────────────────────────

export function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3_958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface APNsEnv {
  APNS_KEY?: string;
  APNS_KEY_ID?: string;
  APNS_TEAM_ID?: string;
  APNS_BUNDLE_ID?: string;
}

export interface NotificationPayload {
  earthquakeId: string;
  magnitude: number;
  place: string;
  time: number;
  latitude: number;
  longitude: number;
  depth: number;
  distance?: number;
  cityName?: string;
}

export interface APNsResult {
  success: boolean;
  error?: string;
  invalidToken?: boolean;
}

export async function sendAPNs(
  deviceToken: string,
  n: NotificationPayload,
  env: APNsEnv,
  production = true,
): Promise<APNsResult> {
  if (!env.APNS_KEY || !env.APNS_KEY_ID || !env.APNS_TEAM_ID) {
    return { success: false, error: 'APNs env vars not configured' };
  }

  const bundleId = env.APNS_BUNDLE_ID ?? 'com.baytremor.app';
  const isMajor  = n.magnitude >= 5.0;
  const isStrong = n.magnitude >= 4.0;

  const title = isMajor ? '⚠️ MAJOR EARTHQUAKE' : isStrong ? '🔴 Strong Earthquake' : '🟡 Earthquake Alert';
  let body = `M${n.magnitude.toFixed(1)} ${n.place}`;
  if (n.distance !== undefined && n.cityName) body += ` • ${n.distance.toFixed(1)} mi from ${n.cityName}`;

  const apnsPayload = {
    aps: {
      alert: { title, body },
      sound: isMajor ? { critical: 1, name: 'default', volume: 1.0 } : 'default',
      badge: 1,
      'thread-id': 'earthquakes',
      'interruption-level': isMajor ? 'critical' : isStrong ? 'time-sensitive' : 'active',
      'relevance-score': Math.min(1.0, n.magnitude / 5.0),
    },
    earthquakeId: n.earthquakeId,
    magnitude: n.magnitude,
    latitude: n.latitude,
    longitude: n.longitude,
  };

  const host  = production ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
  const token = await makeAPNsJWT(env.APNS_KEY_ID, env.APNS_TEAM_ID, env.APNS_KEY);

  const res = await fetch(`https://${host}/3/device/${deviceToken}`, {
    method: 'POST',
    headers: {
      authorization:       `bearer ${token}`,
      'apns-topic':        bundleId,
      'apns-push-type':    'alert',
      'apns-priority':     isMajor ? '10' : '5',
      'apns-expiration':   '0',
      'content-type':      'application/json',
    },
    body: JSON.stringify(apnsPayload),
  });

  if (res.status === 200)  return { success: true };
  if (res.status === 410)  return { success: false, error: 'invalid_token', invalidToken: true };
  const errText = await res.text().catch(() => '');
  return { success: false, error: `APNs ${res.status}: ${errText}` };
}
