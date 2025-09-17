import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    // Send query to FastAPI backend
    const response = await fetch(`${FASTAPI_BASE_URL}/generate-flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        num_flashcards: 5,
        difficulty: "easy"
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { 
          error: errorData.detail || 'Failed to generate flashcards',
          success: false 
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    // For now, return the raw response and let the frontend handle parsing
    // In a production app, you'd want to parse this into a structured format
    return NextResponse.json({
      success: true,
      rawResponse: result.flashcards,
      sources: result.sources || [],
      // You can add structured parsing here later
      flashcardSet: {
        title: "AI Generated Flashcards",
        cards: result.flashcards, // Will be populated by frontend parsing or enhanced backend processing
        totalCards: 5,
        difficulty: "easy"
      }
    })

  } catch (error) {
    console.error('AI flashcards generation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during flashcards generation',
        success: false 
      },
      { status: 500 }
    )
  }
}
