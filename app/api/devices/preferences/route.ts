import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import clientPromise from '@/lib/mongodb';

/**
 * PUT /api/devices/preferences - Update notification preferences
 * 
 * Allows the iOS app to update push notification settings
 * for a registered device.
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { deviceToken, preferences } = body;
    
    if (!deviceToken) {
      return NextResponse.json(
        { error: 'Device token is required' },
        { status: 400 }
      );
    }
    
    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences object is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    if (!client) {
      throw new Error('Failed to connect to database');
    }
    const db = client.db('earthquake-tracker');
    const devicesCollection = db.collection('devices');
    
    // Validate preferences
    const validatedPreferences = {
      enabled: typeof preferences.enabled === 'boolean' ? preferences.enabled : true,
      minimumMagnitude: typeof preferences.minimumMagnitude === 'number' 
        ? Math.max(0, Math.min(10, preferences.minimumMagnitude)) 
        : 3.0,
      radiusMiles: typeof preferences.radiusMiles === 'number' 
        ? Math.max(1, Math.min(100, preferences.radiusMiles)) 
        : 25,
      alertOnFelt: typeof preferences.alertOnFelt === 'boolean' ? preferences.alertOnFelt : true,
      alertOnSwarms: typeof preferences.alertOnSwarms === 'boolean' ? preferences.alertOnSwarms : true,
      latitude: typeof preferences.latitude === 'number' ? preferences.latitude : null,
      longitude: typeof preferences.longitude === 'number' ? preferences.longitude : null,
    };
    
    const result = await devicesCollection.updateOne(
      { deviceToken },
      {
        $set: {
          preferences: validatedPreferences,
          updatedAt: new Date(),
        },
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Device not found. Please register first.' },
        { status: 404 }
      );
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('Device preferences updated', {
      path: '/api/devices/preferences',
      method: 'PUT',
      statusCode: 200,
      duration,
      preferences: {
        enabled: validatedPreferences.enabled,
        minimumMagnitude: validatedPreferences.minimumMagnitude,
        radiusMiles: validatedPreferences.radiusMiles,
      },
    });
    
    return NextResponse.json({
      success: true,
      preferences: validatedPreferences,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to update device preferences', {
      path: '/api/devices/preferences',
      method: 'PUT',
      statusCode: 500,
      duration,
      error,
    });
    
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
