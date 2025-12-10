import { NextRequest, NextResponse } from 'next/server';
import { getRegionForCoordinates } from '@/lib/regions';
import { Earthquake } from '@/lib/types';
import { logger, logExternalCall } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

// Fetch a single earthquake from USGS by event ID
async function fetchFromUSGS(id: string): Promise<Earthquake | null> {
  const startTime = Date.now();
  
  try {
    // USGS event detail endpoint
    const response = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${id}.geojson`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      logExternalCall('usgs', 'fetchDetail', false, duration, {
        earthquakeId: id,
        statusCode: response.status,
      });
      return null;
    }
    
    const feature = await response.json();
    const [longitude, latitude, depth] = feature.geometry.coordinates;
    
    logExternalCall('usgs', 'fetchDetail', true, duration, {
      earthquakeId: id,
      magnitude: feature.properties.mag,
    });
    
    return {
      id: feature.id,
      magnitude: feature.properties.mag,
      place: feature.properties.place,
      time: new Date(feature.properties.time),
      timestamp: feature.properties.time,
      latitude,
      longitude,
      depth,
      felt: feature.properties.felt,
      significance: feature.properties.sig,
      url: feature.properties.url,
      region: getRegionForCoordinates(latitude, longitude),
    };
  } catch (error) {
    logExternalCall('usgs', 'fetchDetail', false, Date.now() - startTime, {
      earthquakeId: id,
      error,
    });
    return null;
  }
}

// Search in local data files
function searchLocalData(id: string): Earthquake | null {
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (data.features) {
        const feature = data.features.find((f: { id: string }) => f.id === id);
        if (feature) {
          const [longitude, latitude, depth] = feature.geometry.coordinates;
          return {
            id: feature.id,
            magnitude: feature.properties.mag,
            place: feature.properties.place,
            time: new Date(feature.properties.time),
            timestamp: feature.properties.time,
            latitude,
            longitude,
            depth,
            felt: feature.properties.felt,
            significance: feature.properties.sig,
            url: feature.properties.url,
            region: getRegionForCoordinates(latitude, longitude),
          };
        }
      }
    }
  } catch (error) {
    logger.error('Error searching local earthquake data', {
      earthquakeId: id,
      error,
    });
  }
  
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  if (!id) {
    logger.warn('Earthquake detail request missing ID', {
      path: '/api/earthquake/[id]',
      method: 'GET',
      statusCode: 400,
      duration: Date.now() - startTime,
    });
    
    return NextResponse.json(
      { error: 'Earthquake ID is required' },
      { status: 400 }
    );
  }
  
  // First try USGS API (for recent earthquakes)
  let earthquake = await fetchFromUSGS(id);
  let source = 'usgs';
  
  // If not found in USGS, search local data
  if (!earthquake) {
    earthquake = searchLocalData(id);
    source = 'local';
  }
  
  if (!earthquake) {
    logger.info('Earthquake not found', {
      path: '/api/earthquake/[id]',
      method: 'GET',
      statusCode: 404,
      duration: Date.now() - startTime,
      earthquakeId: id,
    });
    
    return NextResponse.json(
      { error: 'Earthquake not found' },
      { status: 404 }
    );
  }
  
  logger.info('Earthquake detail retrieved successfully', {
    path: '/api/earthquake/[id]',
    method: 'GET',
    statusCode: 200,
    duration: Date.now() - startTime,
    earthquakeId: id,
    magnitude: earthquake.magnitude,
    region: earthquake.region,
    source,
  });
  
  return NextResponse.json(earthquake);
}

