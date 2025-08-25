import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization');

    const headers = authHeader && authHeader.startsWith('Bearer ')
      ? { 'Authorization': authHeader, 'Content-Type': 'application/json' }
      : { 'x-dev-auth': 'true', 'Content-Type': 'application/json' };

    const resp = await fetch(`${BACKEND_URL}/api/assessments/plan`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json({ success: false, error: `Backend error: ${resp.status}`, details: data }, { status: resp.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to plan assessments', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}


