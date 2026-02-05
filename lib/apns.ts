/**
 * Apple Push Notification Service (APNs) Client
 * 
 * Sends push notifications to iOS devices for earthquake alerts.
 * Uses JWT-based authentication (recommended by Apple).
 * 
 * Setup:
 * 1. Create APNs Key in Apple Developer Portal
 * 2. Set environment variables:
 *    - APNS_KEY_ID: The key ID from Apple
 *    - APNS_TEAM_ID: Your Apple Developer Team ID
 *    - APNS_KEY: The .p8 key contents (base64 encoded)
 *    - APNS_BUNDLE_ID: Your app's bundle ID (e.g., com.baytremor.app)
 */

import jwt from 'jsonwebtoken';

interface APNsConfig {
  keyId: string;
  teamId: string;
  privateKey: string;
  bundleId: string;
  production: boolean;
}

interface EarthquakeNotification {
  deviceToken: string;
  earthquake: {
    id: string;
    magnitude: number;
    place: string;
    time: number;
    latitude: number;
    longitude: number;
    depth: number;
    distance?: number;
  };
  cityName?: string;
}

interface APNsPayload {
  aps: {
    alert: {
      title: string;
      subtitle?: string;
      body: string;
    };
    sound: string | { critical: number; name: string; volume: number };
    badge?: number;
    'thread-id'?: string;
    'interruption-level'?: 'passive' | 'active' | 'time-sensitive' | 'critical';
    'relevance-score'?: number;
  };
  earthquakeId?: string;
  magnitude?: number;
  latitude?: number;
  longitude?: number;
}

class APNsClient {
  private config: APNsConfig;
  private jwtToken: string | null = null;
  private jwtExpiry: number = 0;

  constructor() {
    this.config = {
      keyId: process.env.APNS_KEY_ID || '',
      teamId: process.env.APNS_TEAM_ID || '',
      privateKey: this.decodeKey(process.env.APNS_KEY || ''),
      bundleId: process.env.APNS_BUNDLE_ID || 'com.baytremor.app',
      // Use sandbox for development builds, production for App Store builds
      // Set APNS_USE_SANDBOX=true in Netlify to test with development builds
      production: process.env.APNS_USE_SANDBOX !== 'true',
    };
  }

  private decodeKey(key: string): string {
    if (!key) return '';
    
    try {
      // Clean up the key - remove any whitespace/newlines that might have been added
      let cleanKey = key.replace(/\s/g, '');
      
      // If it's base64 encoded (doesn't start with the PEM header), decode it
      if (!cleanKey.includes('-----BEGIN')) {
        const decoded = Buffer.from(cleanKey, 'base64').toString('utf-8');
        console.log('APNs key decoded, starts with:', decoded.substring(0, 30));
        return decoded;
      }
      
      // Already in PEM format
      return key;
    } catch (error) {
      console.error('APNs key decode error:', error);
      return key;
    }
  }

  /**
   * Check if APNs is configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.keyId &&
      this.config.teamId &&
      this.config.privateKey &&
      this.config.bundleId
    );
  }

  /**
   * Generate or refresh JWT token for APNs authentication
   */
  private getJWT(): string {
    const now = Math.floor(Date.now() / 1000);

    // Refresh token if expired or about to expire (within 30 minutes)
    if (!this.jwtToken || now >= this.jwtExpiry - 1800) {
      const claims = {
        iss: this.config.teamId,
        iat: now,
      };

      this.jwtToken = jwt.sign(claims, this.config.privateKey, {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: this.config.keyId,
        },
      });

      // Token valid for 1 hour
      this.jwtExpiry = now + 3600;
    }

    return this.jwtToken;
  }

  /**
   * Get APNs endpoint URL
   */
  private getEndpoint(deviceToken: string): string {
    const host = this.config.production
      ? 'api.push.apple.com'
      : 'api.sandbox.push.apple.com';
    return `https://${host}/3/device/${deviceToken}`;
  }

  /**
   * Send a push notification using HTTP/2 (required by APNs)
   */
  async send(notification: EarthquakeNotification): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'APNs not configured' };
    }

    const { deviceToken, earthquake, cityName } = notification;
    const { magnitude, place, distance } = earthquake;

    // Determine priority based on magnitude
    const isMajor = magnitude >= 5.0;
    const isStrong = magnitude >= 4.0;

    // Build notification title
    let title: string;
    if (isMajor) {
      title = '⚠️ MAJOR EARTHQUAKE';
    } else if (isStrong) {
      title = '🔴 Strong Earthquake';
    } else {
      title = '🟡 Earthquake Alert';
    }

    // Build body
    let body = `M${magnitude.toFixed(1)} ${place}`;
    if (distance !== undefined && cityName) {
      body += ` • ${distance.toFixed(1)} mi from ${cityName}`;
    }

    // Build payload
    const payload: APNsPayload = {
      aps: {
        alert: {
          title,
          body,
        },
        sound: isMajor
          ? { critical: 1, name: 'default', volume: 1.0 }
          : 'default',
        badge: 1,
        'thread-id': 'earthquakes',
        'interruption-level': isMajor ? 'critical' : isStrong ? 'time-sensitive' : 'active',
        'relevance-score': Math.min(1.0, magnitude / 5.0),
      },
      earthquakeId: earthquake.id,
      magnitude: earthquake.magnitude,
      latitude: earthquake.latitude,
      longitude: earthquake.longitude,
    };

    return this.sendWithHttp2(deviceToken, payload, isMajor ? '10' : '5');
  }

  /**
   * Send notification using Node.js HTTP/2 (APNs requires HTTP/2)
   */
  private sendWithHttp2(
    deviceToken: string,
    payload: APNsPayload,
    priority: string
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const http2 = require('http2');
      const host = this.config.production
        ? 'api.push.apple.com'
        : 'api.sandbox.push.apple.com';

      const client = http2.connect(`https://${host}`);

      client.on('error', (err: Error) => {
        console.error('HTTP/2 connection error:', err);
        resolve({ success: false, error: `Connection error: ${err.message}` });
      });

      const headers = {
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        'authorization': `bearer ${this.getJWT()}`,
        'apns-topic': this.config.bundleId,
        'apns-push-type': 'alert',
        'apns-priority': priority,
        'apns-expiration': '0',
        'content-type': 'application/json',
      };

      const req = client.request(headers);

      let responseData = '';
      let statusCode = 0;

      req.on('response', (headers: Record<string, string>) => {
        statusCode = parseInt(headers[':status'] || '0', 10);
      });

      req.on('data', (chunk: Buffer) => {
        responseData += chunk.toString();
      });

      req.on('end', () => {
        client.close();

        if (statusCode === 200) {
          resolve({ success: true });
        } else if (statusCode === 410) {
          resolve({ success: false, error: 'invalid_token' });
        } else {
          console.error(`APNs error (${statusCode}):`, responseData);
          resolve({ success: false, error: `APNs error: ${statusCode} - ${responseData}` });
        }
      });

      req.on('error', (err: Error) => {
        client.close();
        console.error('APNs request error:', err);
        resolve({ success: false, error: `Request error: ${err.message}` });
      });

      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * Send notifications to multiple devices
   */
  async sendBulk(
    deviceTokens: string[],
    earthquake: EarthquakeNotification['earthquake'],
    cityName?: string
  ): Promise<{ sent: number; failed: number; invalidTokens: string[] }> {
    const results = await Promise.allSettled(
      deviceTokens.map((token) =>
        this.send({ deviceToken: token, earthquake, cityName })
      )
    );

    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++;
      } else {
        failed++;
        if (
          result.status === 'fulfilled' &&
          result.value.error === 'invalid_token'
        ) {
          invalidTokens.push(deviceTokens[index]);
        }
      }
    });

    return { sent, failed, invalidTokens };
  }
}

// Export singleton instance
export const apnsClient = new APNsClient();

// Export types
export type { EarthquakeNotification, APNsPayload };
