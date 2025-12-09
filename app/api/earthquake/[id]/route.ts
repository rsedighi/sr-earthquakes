import { NextRequest, NextResponse } from 'next/server';
import { getRegionForCoordinates } from '@/lib/regions';
import { Earthquake } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Fetch a single earthquake from USGS by event ID
async function fetchFromUSGS(id: string): Promise<Earthquake | null> {
  try {
    // USGS event detail endpoint
    const response = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${id}.geojson`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    
    if (!response.ok) {
      return null;
    }
    
    const feature = await response.json();
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
  } catch {
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
    console.error('Error searching local data:', error);
  }
  
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Earthquake ID is required' },
      { status: 400 }
    );
  }
  
  // First try USGS API (for recent earthquakes)
  let earthquake = await fetchFromUSGS(id);
  
  // If not found in USGS, search local data
  if (!earthquake) {
    earthquake = searchLocalData(id);
  }
  
  if (!earthquake) {
    return NextResponse.json(
      { error: 'Earthquake not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(earthquake);
}

