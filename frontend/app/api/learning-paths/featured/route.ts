import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = request.headers.get('authorization')
    
    // Build query string from search params
    const queryString = searchParams.toString()
    const backendUrl = `http://localhost:3001/api/learning-paths/featured${queryString ? `?${queryString}` : ''}`
    
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
      console.error('Backend featured learning paths error:', response.status, errorText)
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
    console.error('Featured learning paths API error:', error)
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
