import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/devices/debug
 * Debug endpoint to check APNs configuration and test notifications
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Check APNs configuration
  const apnsConfig = {
    keyId: process.env.APNS_KEY_ID ? `${process.env.APNS_KEY_ID.substring(0, 4)}...` : 'NOT SET',
    teamId: process.env.APNS_TEAM_ID ? `${process.env.APNS_TEAM_ID.substring(0, 4)}...` : 'NOT SET',
    bundleId: process.env.APNS_BUNDLE_ID || 'NOT SET',
    keyPresent: !!process.env.APNS_KEY,
    keyLength: process.env.APNS_KEY?.length || 0,
    useSandbox: process.env.APNS_USE_SANDBOX === 'true',
    environment: process.env.APNS_USE_SANDBOX === 'true' ? 'sandbox' : 'production',
  };

  if (action === 'test-push') {
    // Test actual push notification
    const deviceToken = searchParams.get('token');
    if (!deviceToken) {
      return NextResponse.json({ error: 'Provide ?token=<device_token>' });
    }

    try {
      // Import and test APNs
      const jwt = await import('jsonwebtoken');
      
      const privateKey = decodeKey(process.env.APNS_KEY || '');
      
      if (!privateKey) {
        return NextResponse.json({ 
          error: 'APNs key not configured or invalid',
          apnsConfig 
        });
      }

      // Generate JWT
      const now = Math.floor(Date.now() / 1000);
      const token = jwt.default.sign(
        { iss: process.env.APNS_TEAM_ID, iat: now },
        privateKey,
        {
          algorithm: 'ES256',
          header: { alg: 'ES256', kid: process.env.APNS_KEY_ID },
        }
      );

      // Determine endpoint
      const host = process.env.APNS_USE_SANDBOX === 'true'
        ? 'api.sandbox.push.apple.com'
        : 'api.push.apple.com';
      
      const url = `https://${host}/3/device/${deviceToken}`;

      // Send test notification
      const payload = {
        aps: {
          alert: {
            title: '🧪 Test Notification',
            body: 'APNs is working correctly!',
          },
          sound: 'default',
          badge: 1,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'authorization': `bearer ${token}`,
          'apns-topic': process.env.APNS_BUNDLE_ID || 'com.baytremor.app',
          'apns-push-type': 'alert',
          'apns-priority': '10',
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseJson = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // Response might be empty on success
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        apnsResponse: responseJson || responseText || '(empty - success)',
        apnsConfig,
        endpoint: url,
        tokenPreview: `${deviceToken.substring(0, 8)}...${deviceToken.substring(deviceToken.length - 8)}`,
      });

    } catch (error) {
      return NextResponse.json({
        error: 'APNs test failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        apnsConfig,
      });
    }
  }

  // Default: show config and devices
  try {
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed', apnsConfig });
    }
    
    const db = client.db('baytremor');
    const devices = await db.collection('devices').find({}).toArray();

    return NextResponse.json({
      apnsConfig,
      deviceCount: devices.length,
      devices: devices.map(d => ({
        tokenPreview: `${d.deviceToken.substring(0, 8)}...${d.deviceToken.substring(d.deviceToken.length - 8)}`,
        platform: d.platform,
        preferences: d.preferences,
        createdAt: d.createdAt,
      })),
      testUrl: devices.length > 0 
        ? `/api/devices/debug?action=test-push&token=${devices[0].deviceToken}`
        : 'No devices registered',
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Database error',
      message: error instanceof Error ? error.message : String(error),
      apnsConfig,
    });
  }
}

function decodeKey(key: string): string {
  if (!key) return '';
  try {
    if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
      return Buffer.from(key, 'base64').toString('utf-8');
    }
    return key;
  } catch {
    return key;
  }
}
