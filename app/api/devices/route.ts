import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import clientPromise from '@/lib/mongodb';

/**
 * POST /api/devices - Register a device for push notifications
 * 
 * Used by the iOS app to register APNs device tokens
 * and notification preferences.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { deviceToken, platform, preferences, userId } = body;
    
    if (!deviceToken) {
      return NextResponse.json(
        { error: 'Device token is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    if (!client) {
      throw new Error('Failed to connect to database');
    }
    const db = client.db('earthquake-tracker');
    const devicesCollection = db.collection('devices');
    
    // Upsert device registration
    const result = await devicesCollection.updateOne(
      { deviceToken },
      {
        $set: {
          deviceToken,
          platform: platform || 'ios',
          preferences: preferences || {
            enabled: true,
            minimumMagnitude: 3.0,
            radiusMiles: 25,
            alertOnFelt: true,
            alertOnSwarms: true,
          },
          userId: userId || null,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    
    const duration = Date.now() - startTime;
    
    logger.info('Device registered for push notifications', {
      path: '/api/devices',
      method: 'POST',
      statusCode: 200,
      duration,
      platform,
      isNew: result.upsertedCount > 0,
    });
    
    return NextResponse.json({
      success: true,
      isNew: result.upsertedCount > 0,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to register device', {
      path: '/api/devices',
      method: 'POST',
      statusCode: 500,
      duration,
      error,
    });
    
    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/devices - Get device info (for admin/debugging)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    const client = await clientPromise;
    if (!client) {
      throw new Error('Failed to connect to database');
    }
    const db = client.db('earthquake-tracker');
    const devicesCollection = db.collection('devices');
    
    const device = await devicesCollection.findOne({ deviceToken: token });
    
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      deviceToken: device.deviceToken,
      platform: device.platform,
      preferences: device.preferences,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    });
  } catch (error) {
    logger.error('Failed to get device', {
      path: '/api/devices',
      method: 'GET',
      error,
    });
    
    return NextResponse.json(
      { error: 'Failed to get device' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/devices - Unregister a device
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceToken } = body;
    
    if (!deviceToken) {
      return NextResponse.json(
        { error: 'Device token is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    if (!client) {
      throw new Error('Failed to connect to database');
    }
    const db = client.db('earthquake-tracker');
    const devicesCollection = db.collection('devices');
    
    await devicesCollection.deleteOne({ deviceToken });
    
    logger.info('Device unregistered', {
      path: '/api/devices',
      method: 'DELETE',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to unregister device', {
      path: '/api/devices',
      method: 'DELETE',
      error,
    });
    
    return NextResponse.json(
      { error: 'Failed to unregister device' },
      { status: 500 }
    );
  }
}
