/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import FileUpload from '@/components/FileUpload'
import { Brain, RotateCcw, CheckCircle, XCircle, ArrowLeft, ArrowRight, Shuffle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid';

interface Flashcard {
  id: string
  question: string
  answer: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface FlashcardSet {
  id: string
  title: string
  cards: Flashcard[]
  totalCards: number
}

export default function AIFlashcards() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set())
  const [correctCards, setCorrectCards] = useState<Set<string>>(new Set())
  const [incorrectCards, setIncorrectCards] = useState<Set<string>>(new Set())
  const [documentsProcessed, setDocumentsProcessed] = useState(0)

  const handleUploadSuccess = (data: any) => {
    setUploadedFiles(prev => [...prev, data.filename])
    setDocumentsProcessed(data.documents_processed)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
  }

  const generateFlashcards = async () => {
    if (uploadedFiles.length === 0) return

    setIsGenerating(true)
    
    try {
      // Call AI flashcards generation API
      const response = await fetch('/api/ai-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        // Parse the AI response to create flashcards
        const aiGeneratedFlashcards: FlashcardSet = {
          id: Date.now().toString(),
          title: `AI Flashcards from ${uploadedFiles[0]}`,
          totalCards: 5,
          cards: parseFlashcardsFromAI(result.rawResponse) // You can enhance this parsing function
        }

        setFlashcardSet(aiGeneratedFlashcards)
        setCurrentCard(0)
        setIsFlipped(false)
        setShowResults(false)
        setStudiedCards(new Set())
        setCorrectCards(new Set())
        setIncorrectCards(new Set())
      } else {
        // Fallback flashcards if AI generation fails
        console.error('Flashcards generation failed:', result.error)
        const fallbackFlashcards: FlashcardSet = {
          id: Date.now().toString(),
          title: `Flashcards from ${uploadedFiles[0]}`,
          totalCards: 2,
          cards: [
            {
              id: '1',
              question: 'AI Service Status',
              answer: 'The AI flashcard generation service encountered an error. Please check your connection and try again.',
              category: 'System',
              difficulty: 'easy'
            },
            {
              id: '2',
              question: 'What should you do next?',
              answer: 'Verify that the FastAPI backend is running, check your internet connection, and ensure the PDF was uploaded successfully.',
              category: 'Troubleshooting',
              difficulty: 'easy'
            }
          ]
        }
        setFlashcardSet(fallbackFlashcards)
        setCurrentCard(0)
        setIsFlipped(false)
        setShowResults(false)
        setStudiedCards(new Set())
        setCorrectCards(new Set())
        setIncorrectCards(new Set())
      }
    } catch (error) {
      console.error('Error generating flashcards:', error)
      // Create error flashcards
      const errorFlashcards: FlashcardSet = {
        id: Date.now().toString(),
        title: `Flashcards from ${uploadedFiles[0]}`,
        totalCards: 1,
        cards: [
          {
            id: '1',
            question: 'Connection Error',
            answer: 'Failed to connect to the AI service. Please check that the FastAPI backend is running and try again.',
            category: 'Error',
            difficulty: 'easy'
          }
        ]
      }
      setFlashcardSet(errorFlashcards)
      setCurrentCard(0)
      setIsFlipped(false)
      setShowResults(false)
      setStudiedCards(new Set())
      setCorrectCards(new Set())
      setIncorrectCards(new Set())
    }

    setIsGenerating(false)
  }

  // Helper function to parse AI response into flashcards format
  const parseFlashcardsFromAI = (aiResponse: {question: string, answer: string, difficulty: string}[]): Flashcard[] => {
    // This is a basic parser - you can enhance this based on the actual AI response format
    // For now, return some sample flashcards that indicate the AI response was received
    return aiResponse.map(flashcard => ({
      id: uuidv4(),
      question: flashcard.question,
      answer: flashcard.answer,
      category: "AI Generated",
      difficulty: flashcard.difficulty == "easy" ? "easy" : flashcard.difficulty == "medium" ? "medium" : "hard",
      isFlipped: false 
    }));
  }

  const startStudying = () => {
    setCurrentCard(0)
    setIsFlipped(false)
    setShowResults(false)
    setStudiedCards(new Set())
    setCorrectCards(new Set())
    setIncorrectCards(new Set())
  }

  const nextCard = () => {
    if (flashcardSet && currentCard < flashcardSet.cards.length - 1) {
      setCurrentCard(currentCard + 1)
      setIsFlipped(false)
    } else {
      setShowResults(true)
    }
  }

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setIsFlipped(false)
    }
  }

  const shuffleCards = () => {
    if (!flashcardSet) return
    
    const shuffledCards = [...flashcardSet.cards].sort(() => Math.random() - 0.5)
    setFlashcardSet({ ...flashcardSet, cards: shuffledCards })
    setCurrentCard(0)
    setIsFlipped(false)
  }

  const markCorrect = () => {
    if (!flashcardSet) return
    
    const cardId = flashcardSet.cards[currentCard].id
    setStudiedCards(prev => new Set([...prev, cardId]))
    setCorrectCards(prev => new Set([...prev, cardId]))
    setIncorrectCards(prev => {
      const newSet = new Set(prev)
      newSet.delete(cardId)
      return newSet
    })
  }

  const markIncorrect = () => {
    if (!flashcardSet) return
    
    const cardId = flashcardSet.cards[currentCard].id
    setStudiedCards(prev => new Set([...prev, cardId]))
    setIncorrectCards(prev => new Set([...prev, cardId]))
    setCorrectCards(prev => {
      const newSet = new Set(prev)
      newSet.delete(cardId)
      return newSet
    })
  }

  const resetFlashcards = () => {
    setFlashcardSet(null)
    setCurrentCard(0)
    setIsFlipped(false)
    setShowResults(false)
    setStudiedCards(new Set())
    setCorrectCards(new Set())
    setIncorrectCards(new Set())
  }

  const clearFiles = () => {
    setUploadedFiles([])
    setFlashcardSet(null)
    setDocumentsProcessed(0)
    setCurrentCard(0)
    setIsFlipped(false)
    setShowResults(false)
    setStudiedCards(new Set())
    setCorrectCards(new Set())
    setIncorrectCards(new Set())
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (showResults && flashcardSet) {
    const accuracy = studiedCards.size > 0 ? Math.round((correctCards.size / studiedCards.size) * 100) : 0
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="mb-8">
                {accuracy >= 70 ? (
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Session Complete!</h1>
                <p className="text-gray-600">Here&apos;s how you performed</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <div className="text-6xl font-bold text-purple-600 mb-2">{accuracy}%</div>
                <div className="text-gray-600">
                  {accuracy >= 70 ? 'Excellent work!' : 'Keep practicing to improve!'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {studiedCards.size}
                  </div>
                  <div className="text-sm text-gray-600">Cards Studied</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {correctCards.size}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {incorrectCards.size}
                  </div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={resetFlashcards}
                  className="bg-purple-600 text-white px-6 py-3 cursor-pointer rounded-lg hover:bg-purple-700 transition-colors mr-4"
                >
                  <RotateCcw className="h-4 w-4 inline mr-2" />
                  Create New Set
                </button>
                <button
                  onClick={startStudying}
                  className="border border-gray-300 text-gray-700 px-6 py-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Study Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (flashcardSet && !showResults) {
    const card = flashcardSet.cards[currentCard]
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-lg">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{flashcardSet.title}</h1>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={shuffleCards}
                      className="p-2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                      title="Shuffle cards"
                    >
                      <Shuffle className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentCard + 1} of {flashcardSet.cards.length}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentCard + 1) / flashcardSet.cards.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Flashcard */}
              <div className="p-8">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-4 flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(card.difficulty)}`}>
                      {card.difficulty}
                    </span>
                    <span className="text-sm text-gray-500">{card.category}</span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-8 min-h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        {isFlipped ? 'Answer:' : 'Question:'}
                      </h2>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {isFlipped ? card.answer : card.question}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="bg-purple-600 text-white px-6 py-3 cursor-pointer rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                      {isFlipped ? 'Show Question' : 'Show Answer'}
                    </button>
                  </div>

                  {isFlipped && (
                    <div className="mt-6 flex justify-center space-x-4">
                      <button
                        onClick={markIncorrect}
                        className="flex items-center px-4 py-2 cursor-pointer border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Incorrect
                      </button>
                      <button
                        onClick={markCorrect}
                        className="flex items-center px-4 py-2 cursor-pointer border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Correct
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="p-6 border-t border-gray-200 flex justify-between">
                <button
                  onClick={prevCard}
                  disabled={currentCard === 0}
                  className="flex items-center px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                <button
                  onClick={nextCard}
                  className="flex items-center px-4 py-2 cursor-pointer bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {currentCard === flashcardSet.cards.length - 1 ? 'Finish' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Flashcards</h1>
            <p className="text-gray-600">
              Upload your course materials and create smart flashcards to help you memorize key concepts faster
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  Upload Materials
                </h2>
                {uploadedFiles.length > 0 && (
                  <button
                    onClick={clearFiles}
                    className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                disabled={uploadedFiles.length > 0}
              />

              {uploadedFiles.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Uploaded Files:</h3>
                  <ul className="space-y-1">
                    {uploadedFiles.map((filename, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {filename}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    {documentsProcessed} document chunks processed
                  </p>
                </div>
              )}
            </div>

            {/* Generate Flashcards Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
                Generate Flashcards
              </h2>

              <div className="space-y-4">
                <p className="text-gray-600">
                  {uploadedFiles.length === 0
                    ? 'Upload PDF files to generate AI-powered smart flashcards'
                    : `Ready to generate AI flashcards from ${uploadedFiles.length} file(s)`}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                    Key concepts extraction
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                    Difficulty levels
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                    Category organization
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                    Progress tracking
                  </div>
                </div>

                <button
                  onClick={generateFlashcards}
                  disabled={uploadedFiles.length === 0 || isGenerating}
                  className="w-full bg-purple-600 text-white cursor-pointer py-3 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Flashcards...
                    </div>
                  ) : (
                    'Generate Flashcards'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
