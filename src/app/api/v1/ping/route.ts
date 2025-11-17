
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlToPing = searchParams.get('url');

  if (!urlToPing) {
    return NextResponse.json({ success: false, error: 'URL parameter is missing' }, { status: 400 });
  }

  try {
    const response = await fetch(urlToPing, { 
      method: 'HEAD', 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    return NextResponse.json({ 
        success: true, 
        status: response.status,
        statusText: response.statusText,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
        return NextResponse.json({ success: false, error: 'Request timed out' }, { status: 504 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to ping URL' }, { status: 500 });
  }
}
