import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface DevicePreferences {
  notificationsEnabled: boolean;
  minimumMagnitude: number;
  alertRadius: number;
  selectedCity: string;
}

interface DeviceRegistration {
  deviceToken: string;
  platform: 'ios' | 'android';
  preferences: DevicePreferences;
}

/**
 * POST /api/devices
 * Register or update a device for push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body: DeviceRegistration = await request.json();
    
    // Validate required fields
    if (!body.deviceToken || typeof body.deviceToken !== 'string') {
      return NextResponse.json(
        { error: 'deviceToken is required' },
        { status: 400 }
      );
    }
    
    if (!body.platform || !['ios', 'android'].includes(body.platform)) {
      return NextResponse.json(
        { error: 'platform must be ios or android' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('baytremor');
    const devicesCollection = db.collection('devices');
    
    // Upsert device registration
    const result = await devicesCollection.updateOne(
      { deviceToken: body.deviceToken },
      {
        $set: {
          deviceToken: body.deviceToken,
          platform: body.platform,
          preferences: body.preferences || {
            notificationsEnabled: true,
            minimumMagnitude: 3.0,
            alertRadius: 25,
            selectedCity: 'San Ramon'
          },
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      deviceId: body.deviceToken.substring(0, 8) + '...',
      isNewDevice: result.upsertedCount > 0
    });
    
  } catch (error) {
    console.error('Device registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/devices
 * Get device count and stats (for admin purposes)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stats = searchParams.get('stats');
    
    if (stats !== 'true') {
      return NextResponse.json(
        { error: 'Use ?stats=true to get device statistics' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('baytremor');
    const devicesCollection = db.collection('devices');
    
    // Get device counts
    const totalDevices = await devicesCollection.countDocuments();
    const iosDevices = await devicesCollection.countDocuments({ platform: 'ios' });
    const androidDevices = await devicesCollection.countDocuments({ platform: 'android' });
    const notificationsEnabled = await devicesCollection.countDocuments({ 
      'preferences.notificationsEnabled': true 
    });
    
    // Get recent registrations (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRegistrations = await devicesCollection.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });
    
    return NextResponse.json({
      totalDevices,
      iosDevices,
      androidDevices,
      notificationsEnabled,
      recentRegistrations,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Device stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get device stats' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/devices
 * Update device preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.deviceToken) {
      return NextResponse.json(
        { error: 'deviceToken is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('baytremor');
    const devicesCollection = db.collection('devices');
    
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };
    
    // Only update fields that are provided
    if (body.preferences) {
      updateData.preferences = body.preferences;
    }
    
    const result = await devicesCollection.updateOne(
      { deviceToken: body.deviceToken },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      updated: result.modifiedCount > 0
    });
    
  } catch (error) {
    console.error('Device update error:', error);
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/devices
 * Unregister a device
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceToken = searchParams.get('deviceToken');
    
    if (!deviceToken) {
      return NextResponse.json(
        { error: 'deviceToken query parameter is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('baytremor');
    const devicesCollection = db.collection('devices');
    
    const result = await devicesCollection.deleteOne({ deviceToken });
    
    return NextResponse.json({
      success: true,
      deleted: result.deletedCount > 0
    });
    
  } catch (error) {
    console.error('Device deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete device' },
      { status: 500 }
    );
  }
}
