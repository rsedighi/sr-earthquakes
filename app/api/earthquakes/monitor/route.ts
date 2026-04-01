import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { apnsClient } from '@/lib/apns';
import { revalidateEarthquakeCaches } from '@/lib/revalidate-earthquake-cache';
import { getPusherServer, EARTHQUAKE_CHANNEL, PUSHER_EVENTS } from '@/lib/pusher';

/**
 * Earthquake monitor — intended to run on Vercel Cron (`vercel.json`).
 *
 * 1. Fetch latest earthquakes from USGS
 * 2. Detect new events (MongoDB `processed_earthquakes`)
 * 3. Send APNs where configured
 * 4. Call `revalidateEarthquakeCaches()` when there are new events (on-demand ISR)
 *
 * Optional: set `CRON_SECRET` and send `Authorization: Bearer <CRON_SECRET>` (Vercel can inject this for cron).
 */

const USGS_FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';

const BAY_AREA_BOUNDS = {
  minLat: 36.9,
  maxLat: 38.35,
  minLon: -123.0,
  maxLon: -121.4,
};

// Minimum magnitude to even consider for notifications
const MIN_NOTIFICATION_MAGNITUDE = 2.5;

// City coordinates for distance calculations
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'Oakland': { lat: 37.8044, lon: -122.2712 },
  'Berkeley': { lat: 37.8716, lon: -122.2727 },
  'San Jose': { lat: 37.3382, lon: -121.8863 },
  'San Ramon': { lat: 37.7799, lon: -121.9780 },
  'Fremont': { lat: 37.5485, lon: -121.9886 },
  'Hayward': { lat: 37.6688, lon: -122.0808 },
  'Walnut Creek': { lat: 37.9101, lon: -122.0652 },
  'Palo Alto': { lat: 37.4419, lon: -122.1430 },
  'Dublin': { lat: 37.7022, lon: -121.9358 },
  'Pleasanton': { lat: 37.6624, lon: -121.8747 },
  'Livermore': { lat: 37.6819, lon: -121.7680 },
  'Concord': { lat: 37.9780, lon: -122.0311 },
  'Santa Rosa': { lat: 38.4404, lon: -122.7141 },
  'Napa': { lat: 38.2975, lon: -122.2869 },
  'Vallejo': { lat: 38.1041, lon: -122.2566 },
  'San Mateo': { lat: 37.5630, lon: -122.3255 },
  'Redwood City': { lat: 37.4852, lon: -122.2364 },
  'Mountain View': { lat: 37.3861, lon: -122.0839 },
  'Sunnyvale': { lat: 37.3688, lon: -122.0363 },
  'Santa Clara': { lat: 37.3541, lon: -121.9552 },
  'Daly City': { lat: 37.6879, lon: -122.4702 },
  'San Rafael': { lat: 37.9735, lon: -122.5311 },
  'Richmond': { lat: 37.9358, lon: -122.3478 },
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
    sig?: number;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch latest earthquakes from USGS
    const response = await fetch(USGS_FEED, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`USGS API returned ${response.status}`);
    }

    const data = await response.json();

    // 2. Filter to Bay Area earthquakes with minimum magnitude
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
      return NextResponse.json({
        success: true,
        message: 'No significant Bay Area earthquakes',
        duration: Date.now() - startTime,
      });
    }

    // 3. Connect to MongoDB
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const db = client.db('baytremor');
    const processedCollection = db.collection('processed_earthquakes');
    const devicesCollection = db.collection('devices');

    // 4. Find earthquakes we haven't processed yet
    const earthquakeIds = bayAreaQuakes.map((q) => q.id);
    const alreadyProcessed = await processedCollection
      .find({ earthquakeId: { $in: earthquakeIds } })
      .toArray();
    const processedIds = new Set(alreadyProcessed.map((p) => p.earthquakeId));

    const newQuakes = bayAreaQuakes.filter((q) => !processedIds.has(q.id));

    if (newQuakes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new earthquakes to process',
        checked: bayAreaQuakes.length,
        duration: Date.now() - startTime,
      });
    }

    console.log(`🆕 Found ${newQuakes.length} new earthquakes to process`);

    // 5. Get all iOS devices with notifications enabled
    const devices = await devicesCollection
      .find({
        platform: 'ios',
        'preferences.notificationsEnabled': true,
      })
      .toArray();

    // 6. Process each new earthquake
    const results = [];

    for (const quake of newQuakes) {
      const [lon, lat, depth] = quake.geometry.coordinates;
      const earthquake = {
        id: quake.id,
        magnitude: quake.properties.mag,
        place: quake.properties.place,
        time: quake.properties.time,
        latitude: lat,
        longitude: lon,
        depth: depth,
        felt: quake.properties.felt,
      };

      // Find devices that should receive this notification
      const devicesToNotify: { token: string; city: string; distance: number }[] = [];

      for (const device of devices) {
        const prefs = device.preferences;

        // Check magnitude threshold
        if (earthquake.magnitude < prefs.minimumMagnitude) {
          continue;
        }

        // Check distance
        const cityCoords = CITY_COORDINATES[prefs.selectedCity];
        if (cityCoords) {
          const distance = calculateDistance(
            cityCoords.lat,
            cityCoords.lon,
            earthquake.latitude,
            earthquake.longitude
          );

          if (distance <= prefs.alertRadius) {
            devicesToNotify.push({
              token: device.deviceToken,
              city: prefs.selectedCity,
              distance,
            });
          }
        }
      }

      // Send notifications if APNs is configured
      let sent = 0;
      let failed = 0;

      if (apnsClient.isConfigured() && devicesToNotify.length > 0) {
        const sendResults = await Promise.allSettled(
          devicesToNotify.map((d) =>
            apnsClient.send({
              deviceToken: d.token,
              earthquake: { ...earthquake, distance: d.distance },
              cityName: d.city,
            })
          )
        );

        sendResults.forEach((r) => {
          if (r.status === 'fulfilled' && r.value.success) sent++;
          else failed++;
        });
      }

      // Mark as processed
      await processedCollection.insertOne({
        earthquakeId: quake.id,
        magnitude: earthquake.magnitude,
        place: earthquake.place,
        processedAt: new Date(),
        notificationsSent: sent,
        notificationsFailed: failed,
        devicesMatched: devicesToNotify.length,
      });

      results.push({
        id: quake.id,
        magnitude: earthquake.magnitude,
        place: earthquake.place,
        devicesMatched: devicesToNotify.length,
        sent,
        failed,
      });

      console.log(
        `📤 M${earthquake.magnitude} ${earthquake.place}: ${sent}/${devicesToNotify.length} notifications sent`
      );
    }

    // 7. Clean up old processed records (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await processedCollection.deleteMany({
      processedAt: { $lt: sevenDaysAgo },
    });

    // 8. Bust earthquake `use cache` entries so History / ISR pick up fresh data paths
    revalidateEarthquakeCaches();

    // 9. Push real-time event to connected clients via Pusher
    const pusher = getPusherServer();
    if (pusher) {
      await pusher.trigger(EARTHQUAKE_CHANNEL, PUSHER_EVENTS.NEW_EARTHQUAKE, {
        count: newQuakes.length,
        latest: results[0],
        timestamp: Date.now(),
      }).catch((err: unknown) => console.error('Pusher trigger failed:', err));
    }

    return NextResponse.json({
      success: true,
      newEarthquakes: newQuakes.length,
      results,
      apnsConfigured: apnsClient.isConfigured(),
      totalDevices: devices.length,
      cacheRevalidated: true,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Monitor error:', error);
    return NextResponse.json(
      {
        error: 'Monitor failed',
        message: String(error),
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export { GET as POST };
