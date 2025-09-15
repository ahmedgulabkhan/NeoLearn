import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Send query to FastAPI backend
    const response = await fetch(`${FASTAPI_BASE_URL}/query?query=${query.trim()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { 
          error: errorData.detail || 'Failed to get AI response',
          success: false 
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    let match = result.response.match(/content='([\s\S]*?)' additional_kwargs/);
    if (!match) {
      match = result.response.match(/content="([\s\S]*?)" additional_kwargs/);
    }
    const content = match ? match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\*\*/g, '') : result.response;
    
    return NextResponse.json({
      success: true,
      response: content,
      sources: result.sources || []
    })

  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during AI chat',
        success: false 
      },
      { status: 500 }
    )
  }
}
