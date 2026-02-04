import type { Config, Context } from "@netlify/functions";

/**
 * Netlify Scheduled Function: Earthquake Monitor
 * 
 * Runs every minute to:
 * 1. Fetch latest earthquakes from USGS
 * 2. Check for new earthquakes not yet processed
 * 3. Send push notifications via APNs
 */

const USGS_FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';

const BAY_AREA_BOUNDS = {
  minLat: 36.9,
  maxLat: 38.35,
  minLon: -123.0,
  maxLon: -121.4,
};

const MIN_NOTIFICATION_MAGNITUDE = 2.5;

// Dynamically import mongodb to work with Netlify Functions
async function getMongoClient() {
  const { MongoClient } = await import('mongodb');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  return new MongoClient(uri);
}

// City coordinates
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'Oakland': { lat: 37.8044, lon: -122.2712 },
  'San Jose': { lat: 37.3382, lon: -121.8863 },
  'San Ramon': { lat: 37.7799, lon: -121.9780 },
  'Fremont': { lat: 37.5485, lon: -121.9886 },
  'Berkeley': { lat: 37.8716, lon: -122.2727 },
  'Hayward': { lat: 37.6688, lon: -122.0808 },
  'Walnut Creek': { lat: 37.9101, lon: -122.0652 },
  'Palo Alto': { lat: 37.4419, lon: -122.1430 },
  'Dublin': { lat: 37.7022, lon: -121.9358 },
  'Pleasanton': { lat: 37.6624, lon: -121.8747 },
  'Livermore': { lat: 37.6819, lon: -121.7680 },
  'Concord': { lat: 37.9780, lon: -122.0311 },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
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

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    felt?: number;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

// Simple APNs sender (JWT-based)
async function sendAPNsNotification(
  deviceToken: string,
  earthquake: { magnitude: number; place: string; distance?: number },
  cityName?: string
): Promise<boolean> {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID || 'com.baytremor.app';
  const privateKey = process.env.APNS_KEY;
  
  if (!keyId || !teamId || !privateKey) {
    console.log('APNs not configured');
    return false;
  }

  try {
    const jwt = await import('jsonwebtoken');
    
    // Decode key if base64
    let key = privateKey;
    if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
      key = Buffer.from(privateKey, 'base64').toString('utf-8');
    }
    
    const token = jwt.default.sign(
      { iss: teamId, iat: Math.floor(Date.now() / 1000) },
      key,
      { algorithm: 'ES256', header: { alg: 'ES256', kid: keyId } }
    );

    const isMajor = earthquake.magnitude >= 5.0;
    const isStrong = earthquake.magnitude >= 4.0;
    
    let title = '🟡 Earthquake Alert';
    if (isMajor) title = '⚠️ MAJOR EARTHQUAKE';
    else if (isStrong) title = '🔴 Strong Earthquake';

    let body = `M${earthquake.magnitude.toFixed(1)} ${earthquake.place}`;
    if (earthquake.distance && cityName) {
      body += ` • ${earthquake.distance.toFixed(1)} mi from ${cityName}`;
    }

    const payload = {
      aps: {
        alert: { title, body },
        sound: isMajor ? { critical: 1, name: 'default', volume: 1.0 } : 'default',
        badge: 1,
        'thread-id': 'earthquakes',
        'interruption-level': isMajor ? 'critical' : isStrong ? 'time-sensitive' : 'active',
      },
    };

    const isProduction = process.env.NODE_ENV === 'production';
    const host = isProduction ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
    
    const response = await fetch(`https://${host}/3/device/${deviceToken}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${token}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': isMajor ? '10' : '5',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('APNs error:', error);
    return false;
  }
}

export default async function handler(req: Request, context: Context) {
  const startTime = Date.now();
  console.log('🔍 Earthquake monitor running...');

  try {
    // 1. Fetch from USGS
    const response = await fetch(USGS_FEED);
    if (!response.ok) throw new Error(`USGS returned ${response.status}`);
    
    const data = await response.json();

    // 2. Filter Bay Area quakes
    const bayAreaQuakes: USGSFeature[] = data.features.filter((f: USGSFeature) => {
      const [lon, lat] = f.geometry.coordinates;
      const mag = f.properties.mag || 0;
      return (
        lat >= BAY_AREA_BOUNDS.minLat &&
        lat <= BAY_AREA_BOUNDS.maxLat &&
        lon >= BAY_AREA_BOUNDS.minLon &&
        lon <= BAY_AREA_BOUNDS.maxLon &&
        mag >= MIN_NOTIFICATION_MAGNITUDE
      );
    });

    if (bayAreaQuakes.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No significant Bay Area earthquakes',
        duration: Date.now() - startTime,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Connect to MongoDB
    const client = await getMongoClient();
    await client.connect();
    const db = client.db('baytremor');

    try {
      // 4. Find new earthquakes
      const earthquakeIds = bayAreaQuakes.map(q => q.id);
      const processed = await db.collection('processed_earthquakes')
        .find({ earthquakeId: { $in: earthquakeIds } })
        .toArray();
      const processedIds = new Set(processed.map(p => p.earthquakeId));
      
      const newQuakes = bayAreaQuakes.filter(q => !processedIds.has(q.id));

      if (newQuakes.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No new earthquakes',
          checked: bayAreaQuakes.length,
          duration: Date.now() - startTime,
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      console.log(`🆕 Found ${newQuakes.length} new earthquakes`);

      // 5. Get devices
      const devices = await db.collection('devices')
        .find({
          platform: 'ios',
          'preferences.notificationsEnabled': true,
        })
        .toArray();

      // 6. Process each earthquake
      const results = [];

      for (const quake of newQuakes) {
        const [lon, lat, depth] = quake.geometry.coordinates;
        const earthquake = {
          id: quake.id,
          magnitude: quake.properties.mag,
          place: quake.properties.place,
          latitude: lat,
          longitude: lon,
          depth,
        };

        // Find matching devices
        const toNotify: { token: string; city: string; distance: number }[] = [];

        for (const device of devices) {
          const prefs = device.preferences;
          if (earthquake.magnitude < prefs.minimumMagnitude) continue;

          const cityCoords = CITY_COORDINATES[prefs.selectedCity];
          if (cityCoords) {
            const distance = calculateDistance(
              cityCoords.lat, cityCoords.lon,
              earthquake.latitude, earthquake.longitude
            );
            if (distance <= prefs.alertRadius) {
              toNotify.push({ token: device.deviceToken, city: prefs.selectedCity, distance });
            }
          }
        }

        // Send notifications
        let sent = 0;
        for (const d of toNotify) {
          const success = await sendAPNsNotification(
            d.token,
            { ...earthquake, distance: d.distance },
            d.city
          );
          if (success) sent++;
        }

        // Mark processed
        await db.collection('processed_earthquakes').insertOne({
          earthquakeId: quake.id,
          magnitude: earthquake.magnitude,
          place: earthquake.place,
          processedAt: new Date(),
          notificationsSent: sent,
          devicesMatched: toNotify.length,
        });

        results.push({
          id: quake.id,
          magnitude: earthquake.magnitude,
          place: earthquake.place,
          sent,
          matched: toNotify.length,
        });

        console.log(`📤 M${earthquake.magnitude} ${earthquake.place}: ${sent}/${toNotify.length} sent`);
      }

      // Cleanup old records
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await db.collection('processed_earthquakes').deleteMany({
        processedAt: { $lt: sevenDaysAgo },
      });

      return new Response(JSON.stringify({
        success: true,
        newEarthquakes: newQuakes.length,
        results,
        totalDevices: devices.length,
        duration: Date.now() - startTime,
      }), { headers: { 'Content-Type': 'application/json' } });

    } finally {
      await client.close();
    }

  } catch (error) {
    console.error('Monitor error:', error);
    return new Response(JSON.stringify({
      error: String(error),
      duration: Date.now() - startTime,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// Netlify scheduled function config
export const config: Config = {
  schedule: "* * * * *", // Every minute
};
