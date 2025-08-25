import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    // Build query parameters for backend
    const backendParams = new URLSearchParams();
    if (category && category !== 'all') backendParams.set('category', category);
    if (difficulty && difficulty !== 'all') backendParams.set('difficulty', difficulty);
    if (type) backendParams.set('type', type);
    backendParams.set('limit', limit);
    backendParams.set('offset', offset);

    // Get auth token from request headers
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Call backend API
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/assessments/available?${backendParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('Backend assessment fetch failed:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorData
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${backendResponse.status}`,
          details: errorData
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Assessment API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch assessments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Call backend API to create new assessment
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/assessments`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${backendResponse.status}`,
          details: errorData
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Assessment creation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}