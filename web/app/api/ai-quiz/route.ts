import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        num_questions: 8,
        difficulty: 'easy'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { 
          error: errorData.detail || 'Failed to generate quiz',
          success: false 
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    const questionsList = result.questions
    
    // For now, return the raw response and let the frontend handle parsing
    // In a production app, you'd want to parse this into a structured format
    return NextResponse.json({
      success: true,
      rawResponse: questionsList,
      sources: result.sources || [],
      // You can add structured parsing here later
      quiz: {
        title: "AI Generated Quiz",
        questions: [], // Will be populated by frontend parsing or enhanced backend processing
        difficulty: "easy",
        questionCount: 8
      }
    })

  } catch (error) {
    console.error('AI quiz generation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during quiz generation',
        success: false 
      },
      { status: 500 }
    )
  }
}
