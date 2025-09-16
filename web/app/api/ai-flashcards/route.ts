import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const { cardCount = 8, difficulty = 'mixed' } = await request.json()

    // Create a specific query for flashcard generation
    const flashcardQuery = `Generate ${cardCount} flashcards based on the uploaded PDF content with ${difficulty} difficulty level. For each flashcard, provide:
1. A clear, concise question or term on the front
2. A comprehensive answer or definition on the back
3. Categorize each card (e.g., Definitions, Concepts, Techniques, etc.)
4. Assign difficulty level (easy, medium, hard)

Focus on key concepts, important definitions, and essential information that would be valuable for studying and memorization. Format the response as structured flashcards with clear front/back content.`

    // Send query to FastAPI backend
    const response = await fetch(`${FASTAPI_BASE_URL}/query?query=${flashcardQuery}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
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
    
    // Parse the AI response to extract flashcards
    const flashcardsResponse = result.response

    console.log(flashcardsResponse + "is the flashcardsResponse")
    
    // For now, return the raw response and let the frontend handle parsing
    // In a production app, you'd want to parse this into a structured format
    return NextResponse.json({
      success: true,
      rawResponse: flashcardsResponse,
      sources: result.sources || [],
      // You can add structured parsing here later
      flashcardSet: {
        title: "AI Generated Flashcards",
        cards: [], // Will be populated by frontend parsing or enhanced backend processing
        totalCards: cardCount,
        difficulty
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
