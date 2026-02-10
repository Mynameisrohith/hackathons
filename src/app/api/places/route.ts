import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  let radius = searchParams.get('radius') || '5000'; // Default radius 5km
  const keywordParam = searchParams.get('keyword');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API key is not configured.');
    return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
  }

  const keyword = keywordParam || 'supermarket|grocery|electronics|pharmacy|store';
  const type = 'store';

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&keyword=${keyword}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    // If no results and we haven't retried yet, expand radius and retry
    if (data.status === 'ZERO_RESULTS' && radius === '5000') {
      const expandedRadiusUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=${type}&keyword=${keyword}&key=${apiKey}`;
      const expandedRes = await fetch(expandedRadiusUrl);
      const expandedData = await expandedRes.json();
      return NextResponse.json(expandedData);
    }
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API Error:', data.error_message || data.status);
        return NextResponse.json({ error: 'Failed to fetch places', details: data.status }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
