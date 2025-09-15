import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const { difficulty = 'medium', questionCount = 5 } = await request.json()

    // Create a specific query for quiz generation
    const quizQuery = `Generate ${questionCount} multiple choice quiz questions with ${difficulty} difficulty level based on the uploaded PDF content. For each question, provide:
1. The question text
2. Four answer options (A, B, C, D)
3. The correct answer
4. A brief explanation

Format the response as a structured quiz with clear questions, options, and answers.`

    // Send query to FastAPI backend
    const response = await fetch(`${FASTAPI_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        query: quizQuery
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
    
    // Parse the AI response to extract quiz questions
    // This is a simplified parser - you might want to enhance this based on the actual AI response format
    const quizResponse = result.response
    
    // For now, return the raw response and let the frontend handle parsing
    // In a production app, you'd want to parse this into a structured format
    return NextResponse.json({
      success: true,
      rawResponse: quizResponse,
      sources: result.sources || [],
      // You can add structured parsing here later
      quiz: {
        title: "AI Generated Quiz",
        questions: [], // Will be populated by frontend parsing or enhanced backend processing
        difficulty,
        questionCount
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
