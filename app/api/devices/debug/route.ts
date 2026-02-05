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
  const rawKey = process.env.APNS_KEY || '';
  const decodedKey = decodeKey(rawKey);
  
  const apnsConfig = {
    keyId: process.env.APNS_KEY_ID ? `${process.env.APNS_KEY_ID.substring(0, 4)}...` : 'NOT SET',
    teamId: process.env.APNS_TEAM_ID ? `${process.env.APNS_TEAM_ID.substring(0, 4)}...` : 'NOT SET',
    bundleId: process.env.APNS_BUNDLE_ID || 'NOT SET',
    keyPresent: !!process.env.APNS_KEY,
    keyLength: rawKey.length,
    keyDecodedLength: decodedKey.length,
    keyStartsWith: decodedKey.substring(0, 27),
    keyValid: decodedKey.includes('-----BEGIN PRIVATE KEY-----'),
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

      // Send test notification using HTTP/2 (required by APNs)
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

      const result = await sendWithHttp2(
        host,
        deviceToken,
        token,
        process.env.APNS_BUNDLE_ID || 'com.baytremor.app',
        payload
      );

      return NextResponse.json({
        ...result,
        apnsConfig,
        endpoint: `https://${host}/3/device/${deviceToken}`,
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
    // Clean up the key - remove any whitespace/newlines
    let cleanKey = key.replace(/\s/g, '');
    
    if (!cleanKey.includes('-----BEGIN')) {
      return Buffer.from(cleanKey, 'base64').toString('utf-8');
    }
    return key;
  } catch {
    return key;
  }
}

// Send notification using Node.js HTTP/2 (APNs requires HTTP/2)
function sendWithHttp2(
  host: string,
  deviceToken: string,
  jwtToken: string,
  bundleId: string,
  payload: object
): Promise<{ success: boolean; status?: number; error?: string; apnsResponse?: string }> {
  return new Promise((resolve) => {
    const http2 = require('http2');

    const client = http2.connect(`https://${host}`);

    client.on('error', (err: Error) => {
      console.error('HTTP/2 connection error:', err);
      resolve({ success: false, error: `Connection error: ${err.message}` });
    });

    const headers = {
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      'authorization': `bearer ${jwtToken}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
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
        resolve({ success: true, status: statusCode, apnsResponse: '(empty - success)' });
      } else {
        resolve({ 
          success: false, 
          status: statusCode, 
          error: `APNs error: ${statusCode}`,
          apnsResponse: responseData || '(empty)'
        });
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
