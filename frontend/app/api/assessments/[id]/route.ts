import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
      `${BACKEND_URL}/api/assessments/${id}`,
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
      console.error('Backend assessment detail fetch failed:', {
        id,
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
    console.error('Assessment detail API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch assessment details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}