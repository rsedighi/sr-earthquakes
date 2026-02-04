import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { apnsClient } from '@/lib/apns';

// City coordinates for distance calculations
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'Oakland': { lat: 37.8044, lon: -122.2712 },
  'Berkeley': { lat: 37.8716, lon: -122.2727 },
  'San Jose': { lat: 37.3382, lon: -121.8863 },
  'Palo Alto': { lat: 37.4419, lon: -122.1430 },
  'Mountain View': { lat: 37.3861, lon: -122.0839 },
  'Sunnyvale': { lat: 37.3688, lon: -122.0363 },
  'Santa Clara': { lat: 37.3541, lon: -121.9552 },
  'Fremont': { lat: 37.5485, lon: -121.9886 },
  'Hayward': { lat: 37.6688, lon: -122.0808 },
  'San Ramon': { lat: 37.7799, lon: -121.9780 },
  'Dublin': { lat: 37.7022, lon: -121.9358 },
  'Pleasanton': { lat: 37.6624, lon: -121.8747 },
  'Livermore': { lat: 37.6819, lon: -121.7680 },
  'Walnut Creek': { lat: 37.9101, lon: -122.0652 },
  'Concord': { lat: 37.9780, lon: -122.0311 },
  'Richmond': { lat: 37.9358, lon: -122.3478 },
  'San Mateo': { lat: 37.5630, lon: -122.3255 },
  'Redwood City': { lat: 37.4852, lon: -122.2364 },
  'Daly City': { lat: 37.6879, lon: -122.4702 },
  'San Rafael': { lat: 37.9735, lon: -122.5311 },
  'Vallejo': { lat: 38.1041, lon: -122.2566 },
  'Santa Rosa': { lat: 38.4404, lon: -122.7141 },
  'Napa': { lat: 38.2975, lon: -122.2869 },
};

// Calculate distance in miles between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  latitude: number;
  longitude: number;
  depth: number;
  felt?: number;
}

interface DevicePreferences {
  notificationsEnabled: boolean;
  minimumMagnitude: number;
  alertRadius: number;
  selectedCity: string;
}

interface Device {
  deviceToken: string;
  platform: string;
  preferences: DevicePreferences;
}

/**
 * POST /api/devices/notify
 * 
 * Send push notifications for a new earthquake.
 * Called by the earthquake monitoring system when a new quake is detected.
 * 
 * Request body:
 * {
 *   earthquake: { id, magnitude, place, time, latitude, longitude, depth, felt? },
 *   apiKey: "your-secret-key" // For security
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { earthquake, apiKey } = body as { earthquake: Earthquake; apiKey?: string };

    // Verify API key (simple security measure)
    const expectedKey = process.env.INTERNAL_API_KEY;
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate earthquake data
    if (!earthquake?.id || earthquake.magnitude === undefined) {
      return NextResponse.json(
        { error: 'Invalid earthquake data' },
        { status: 400 }
      );
    }

    // Check if APNs is configured
    if (!apnsClient.isConfigured()) {
      console.warn('APNs not configured - skipping push notifications');
      return NextResponse.json({
        success: false,
        error: 'APNs not configured',
        message: 'Set APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY, and APNS_BUNDLE_ID environment variables'
      });
    }

    // Get all devices with notifications enabled
    const client = await clientPromise;
    const db = client.db('baytremor');
    const devicesCollection = db.collection<Device>('devices');

    const devices = await devicesCollection
      .find({
        platform: 'ios',
        'preferences.notificationsEnabled': true,
      })
      .toArray();

    if (devices.length === 0) {
      return NextResponse.json({
        success: true,
        notified: 0,
        message: 'No devices to notify'
      });
    }

    // Filter devices based on their preferences
    const devicesToNotify: { device: Device; distance?: number }[] = [];

    for (const device of devices) {
      const prefs = device.preferences;

      // Check magnitude threshold
      if (earthquake.magnitude < prefs.minimumMagnitude) {
        continue;
      }

      // Check distance from user's city
      const cityCoords = CITY_COORDINATES[prefs.selectedCity];
      if (cityCoords) {
        const distance = calculateDistance(
          cityCoords.lat,
          cityCoords.lon,
          earthquake.latitude,
          earthquake.longitude
        );

        if (distance <= prefs.alertRadius) {
          devicesToNotify.push({ device, distance });
        }
      } else {
        // No city set - notify anyway for significant quakes
        if (earthquake.magnitude >= 4.0) {
          devicesToNotify.push({ device });
        }
      }
    }

    if (devicesToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        notified: 0,
        totalDevices: devices.length,
        message: 'No devices matched notification criteria'
      });
    }

    // Send notifications
    const results = await Promise.allSettled(
      devicesToNotify.map(({ device, distance }) =>
        apnsClient.send({
          deviceToken: device.deviceToken,
          earthquake: {
            ...earthquake,
            distance,
          },
          cityName: device.preferences.selectedCity,
        })
      )
    );

    // Count results
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
          invalidTokens.push(devicesToNotify[index].device.deviceToken);
        }
      }
    });

    // Remove invalid tokens from database
    if (invalidTokens.length > 0) {
      await devicesCollection.deleteMany({
        deviceToken: { $in: invalidTokens },
      });
      console.log(`Removed ${invalidTokens.length} invalid device tokens`);
    }

    return NextResponse.json({
      success: true,
      earthquake: {
        id: earthquake.id,
        magnitude: earthquake.magnitude,
        place: earthquake.place,
      },
      stats: {
        totalDevices: devices.length,
        matchedCriteria: devicesToNotify.length,
        sent,
        failed,
        invalidTokensRemoved: invalidTokens.length,
      },
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
