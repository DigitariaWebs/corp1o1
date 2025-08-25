import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization');

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/assessments/evaluate`,
      {
        method: 'POST',
        headers: authHeader && authHeader.startsWith('Bearer ')
          ? { 'Authorization': authHeader, 'Content-Type': 'application/json' }
          : { 'x-dev-auth': 'true', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Backend error: ${backendResponse.status}`,
          details: data,
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Evaluate API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to evaluate answer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


