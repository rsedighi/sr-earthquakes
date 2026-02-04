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
      production: process.env.NODE_ENV === 'production',
    };
  }

  private decodeKey(key: string): string {
    if (!key) return '';
    // If base64 encoded, decode it
    try {
      if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
        return Buffer.from(key, 'base64').toString('utf-8');
      }
      return key;
    } catch {
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
   * Send a push notification
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

    try {
      const response = await fetch(this.getEndpoint(deviceToken), {
        method: 'POST',
        headers: {
          'authorization': `bearer ${this.getJWT()}`,
          'apns-topic': this.config.bundleId,
          'apns-push-type': 'alert',
          'apns-priority': isMajor ? '10' : '5',
          'apns-expiration': '0', // Send immediately or not at all
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true };
      }

      const errorBody = await response.text();
      console.error(`APNs error (${response.status}):`, errorBody);

      // Handle specific errors
      if (response.status === 410) {
        // Device token is no longer valid - should remove from database
        return { success: false, error: 'invalid_token' };
      }

      return { success: false, error: `APNs error: ${response.status}` };
    } catch (error) {
      console.error('APNs request failed:', error);
      return { success: false, error: String(error) };
    }
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
