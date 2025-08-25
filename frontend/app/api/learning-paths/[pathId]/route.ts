import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { pathId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = request.headers.get('authorization')
    const { pathId } = params
    
    // Build query string from search params
    const queryString = searchParams.toString()
    const backendUrl = `http://localhost:3001/api/learning-paths/${pathId}${queryString ? `?${queryString}` : ''}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Add authorization header if token exists, otherwise use dev bypass
    if (token) {
      headers['Authorization'] = token
    } else {
      headers['x-dev-auth'] = 'true'
    }
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend learning path error:', response.status, errorText)
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Learning path API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { pathId: string } }
) {
  try {
    const token = request.headers.get('authorization')
    const { pathId } = params
    const body = await request.json()
    
    const backendUrl = `http://localhost:3001/api/learning-paths/${pathId}/enroll`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Add authorization header if token exists, otherwise use dev bypass
    if (token) {
      headers['Authorization'] = token
    } else {
      headers['x-dev-auth'] = 'true'
    }
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend enroll error:', response.status, errorText)
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Enroll API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pathId: string } }
) {
  try {
    const token = request.headers.get('authorization')
    const { pathId } = params
    
    const backendUrl = `http://localhost:3001/api/learning-paths/${pathId}/enroll`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Add authorization header if token exists, otherwise use dev bypass
    if (token) {
      headers['Authorization'] = token
    } else {
      headers['x-dev-auth'] = 'true'
    }
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend unenroll error:', response.status, errorText)
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Unenroll API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
