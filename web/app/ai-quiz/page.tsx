/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import FileUpload from '@/components/FileUpload'
import { Play, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid';

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface Quiz {
  id: string
  title: string
  questions: Question[]
  timeLimit?: number
}

export default function AIQuiz() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [documentsProcessed, setDocumentsProcessed] = useState(0)
  const [reviewMode, setReviewMode] = useState(false)

  const handleUploadSuccess = (data: any) => {
    setUploadedFiles(prev => [...prev, data.filename])
    setDocumentsProcessed(data.documents_processed)
  }

  

  

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
  }

  const generateQuiz = async () => {
    if (uploadedFiles.length === 0) return

    setIsGenerating(true)
    
    try {
      // Call AI quiz generation API
      const response = await fetch('/api/ai-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        // Parse the AI response to create quiz questions
        // For now, we'll create a basic structure and let you enhance the parsing
        const aiGeneratedQuiz: Quiz = {
          id: Date.now().toString(),
          title: `AI Quiz from ${uploadedFiles[0]}`,
          timeLimit: 30, // 30 minutes
          questions: parseQuizFromAI(result.rawResponse) // You can enhance this parsing function
        }

        setQuiz(aiGeneratedQuiz)
        setTimeLeft(aiGeneratedQuiz.timeLimit! * 60) // Convert to seconds
        // Initialize quiz session state
        setCurrentQuestion(0)
        setSelectedAnswers(new Array(aiGeneratedQuiz.questions.length).fill(-1))
        setShowResults(false)
      } else {
        // Fallback to a simple quiz if AI generation fails
        console.error('Quiz generation failed:', result.error)
        const fallbackQuiz: Quiz = {
          id: Date.now().toString(),
          title: `Quiz from ${uploadedFiles[0]}`,
          timeLimit: 30,
          questions: [
            {
              id: '1',
              question: 'Based on the uploaded material, what would you say is a key concept discussed?',
              options: [
                'Please refer to the document for specific details',
                'The AI service is currently unavailable',
                'Try uploading the document again',
                'Check your internet connection'
              ],
              correctAnswer: 0,
              explanation: 'AI quiz generation encountered an error. Please try again or check your connection.'
            }
          ]
        }
        setQuiz(fallbackQuiz)
        setTimeLeft(fallbackQuiz.timeLimit! * 60)
      }
    } catch (error) {
      console.error('Error generating quiz:', error)
      // Create an error quiz
      const errorQuiz: Quiz = {
        id: Date.now().toString(),
        title: `Quiz from ${uploadedFiles[0]}`,
        timeLimit: 30,
        questions: [
          {
            id: '1',
            question: 'There was an error generating the quiz. What should you do?',
            options: [
              'Check your internet connection and try again',
              'Make sure the FastAPI backend is running',
              'Verify the PDF was uploaded successfully',
              'All of the above'
            ],
            correctAnswer: 3,
            explanation: 'Quiz generation failed due to a connection error. Please check your setup and try again.'
          }
        ]
      }
      setQuiz(errorQuiz)
      setTimeLeft(errorQuiz.timeLimit! * 60)
    }

    setIsGenerating(false)
  }

  // Helper function to parse AI response into quiz format
  const parseQuizFromAI = (aiResponse: {question: string, options: string[], correct_answer: string | number}[]): Question[] => {
    const normalize = (s: string) => s
      .toLowerCase()
      .replace(/^option\s*[abcd]\s*[:).\-]\s*/i, '') // remove leading 'Option B: '
      .replace(/^[abcd][).:\-]\s*/i, '')               // remove leading 'B) '
      .replace(/^\(?[1-4]\)?[).:\-]\s*/i, '')         // remove leading '2) '
      .trim()

    const letterToIndex: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 }

    return aiResponse.map(q => {
      const options = q.options || []

      // Attempt 1: exact text match (case/whitespace sensitive trimmed)
      let correctIndex = options.findIndex(opt => opt.trim() === String(q.correct_answer).trim())

      if (correctIndex === -1) {
        // Attempt 2: normalized text match (strip labels/punctuation, case-insensitive)
        const normalizedOptions = options.map(normalize)
        const normalizedAnswer = normalize(String(q.correct_answer))
        correctIndex = normalizedOptions.findIndex(opt => opt === normalizedAnswer)
      }

      if (correctIndex === -1) {
        // Attempt 3: if answer is a letter A-D
        const letter = String(q.correct_answer).trim().toLowerCase()
        if (letterToIndex[letter] !== undefined) correctIndex = letterToIndex[letter]
      }

      if (correctIndex === -1) {
        // Attempt 4: if answer is a number 1-4
        const num = Number(q.correct_answer)
        if (!Number.isNaN(num) && num >= 1 && num <= 4) correctIndex = num - 1
      }

      // Fallback: try to infer from patterns like 'Option B: <text>' by matching prefix letters against options index
      if (correctIndex === -1) {
        const m = String(q.correct_answer).trim().match(/option\s*([abcd])/i)
        if (m && letterToIndex[m[1].toLowerCase()]) correctIndex = letterToIndex[m[1].toLowerCase()]
      }

      if (correctIndex === -1) correctIndex = 0 // final fallback to avoid crashes

      return {
        id: uuidv4(),
        question: q.question,
        options,
        correctAnswer: Math.min(Math.max(correctIndex, 0), Math.max(0, options.length - 1)),
        explanation: ""
      }
    })
  }

  const startQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers(new Array(quiz!.questions.length).fill(-1))
    setShowResults(false)
    setTimeLeft(quiz!.timeLimit! * 60)
    setReviewMode(false)
  }

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < quiz!.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const resetQuiz = () => {
    setQuiz(null)
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setShowResults(false)
    setTimeLeft(0)
    setReviewMode(false)
  }

  const clearFiles = () => {
    setUploadedFiles([])
    setQuiz(null)
    setDocumentsProcessed(0)
    setReviewMode(false)
  }

  const calculateScore = () => {
    if (!quiz) return 0
    let correct = 0
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++
      }
    })
    return Math.round((correct / quiz.questions.length) * 100)
  }

  // Timer effect
  React.useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResults) {
      setShowResults(true)
    }
  }, [timeLeft, showResults])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (showResults && quiz) {
    const score = calculateScore()
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="mb-8">
                {score >= 70 ? (
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
                <p className="text-gray-600">Here&apos;s how you performed</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <div className="text-6xl font-bold text-blue-600 mb-2">{score}%</div>
                <div className="text-gray-600">
                  {score >= 70 ? 'Great job!' : 'Keep studying to improve!'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {quiz.questions.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {quiz.questions.filter((_, i) => selectedAnswers[i] === quiz.questions[i].correctAnswer).length}
                  </div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {quiz.questions.filter((_, i) => selectedAnswers[i] !== quiz.questions[i].correctAnswer).length}
                  </div>
                  <div className="text-sm text-gray-600">Incorrect Answers</div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={resetQuiz}
                  className="bg-blue-600 text-white px-6 py-3 cursor-pointer rounded-lg hover:bg-blue-700 transition-colors mr-4"
                >
                  <RotateCcw className="h-4 w-4 inline mr-2" />
                  Take Another Quiz
                </button>
                <button
                  onClick={() => { setShowResults(false); setReviewMode(true); }}
                  className="border border-gray-300 text-gray-700 px-6 py-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Review Answers
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Review Mode: show selected vs correct answers for each question
  if (reviewMode && quiz) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Review Answers</h1>
                <p className="text-gray-600">Compare your choices with the correct answers.</p>
              </div>

              <div className="space-y-6">
                {quiz.questions.map((q, idx) => {
                  const selectedIdx = selectedAnswers[idx]
                  const isCorrect = selectedIdx === q.correctAnswer
                  return (
                    <div key={q.id} className="border rounded-xl p-5">
                      <div className="flex items-start justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Q{idx + 1}. {q.question}
                        </h2>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedIdx === oIdx
                          const isRight = q.correctAnswer === oIdx
                          const base = 'w-full text-left p-3 rounded-lg border'
                          const state = isRight
                            ? 'border-green-300 bg-green-50'
                            : isSelected && !isRight
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200'
                          return (
                            <div key={oIdx} className={`${base} ${state}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-900">{opt}</span>
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Your choice</span>
                                  )}
                                  {isRight && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Correct</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {selectedIdx === -1 && (
                        <p className="mt-3 text-sm text-gray-500">You did not answer this question.</p>
                      )}

                      {/* Explicit answer summary */}
                      <div className="mt-4 text-sm">
                        <p className="text-gray-700">
                          <span className="font-medium">Your answer:</span>{' '}
                          {selectedIdx === -1 ? (
                            <span className="text-gray-500">Unanswered</span>
                          ) : (
                            <span className={selectedIdx === q.correctAnswer ? 'text-green-700' : 'text-red-700'}>
                              {q.options[selectedIdx]}
                            </span>
                          )}
                        </p>
                        <p className="text-gray-700 mt-1">
                          <span className="font-medium">Correct answer:</span>{' '}
                          <span className="text-green-700">{q.options[q.correctAnswer]}</span>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => { setReviewMode(false); setShowResults(true); }}
                  className="px-6 py-3 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Results
                </button>
                <button
                  onClick={resetQuiz}
                  className="px-6 py-3 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (quiz && !showResults) {
    const question = quiz.questions[currentQuestion]
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-lg">
              {/* Quiz Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                  <div className="flex items-center text-blue-600">
                    <Clock className="h-5 w-5 mr-2" />
                    {formatTime(timeLeft)}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </p>
              </div>

              {/* Question */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {question.question}
                </h2>

                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => selectAnswer(index)}
                      className={`w-full text-left p-4 cursor-pointer rounded-lg border-2 transition-all ${
                        selectedAnswers[currentQuestion] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          selectedAnswers[currentQuestion] === index
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnswers[currentQuestion] === index && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <span className="text-gray-900">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="p-6 border-t border-gray-200 flex justify-between">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestion === 0}
                  className="px-6 py-2 border border-gray-300 cursor-pointer text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={nextQuestion}
                  disabled={selectedAnswers[currentQuestion] === -1}
                  className="px-6 py-2 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {currentQuestion === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next'}
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Quiz Generator</h1>
            <p className="text-gray-600">
              Upload your course materials and generate personalized quizzes to test your knowledge
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

            {/* Generate Quiz Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Play className="h-5 w-5 mr-2 text-green-600" />
                Generate Quiz
              </h2>

              <div className="space-y-4">
                <p className="text-gray-600">
                  {uploadedFiles.length === 0
                    ? 'Upload PDF files to generate a personalized quiz using AI'
                    : `Ready to generate AI-powered quiz from ${uploadedFiles.length} file(s)`}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Multiple choice questions
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Adaptive difficulty
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Detailed explanations
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Time tracking
                  </div>
                </div>

                <button
                  onClick={generateQuiz}
                  disabled={uploadedFiles.length === 0 || isGenerating}
                  className="w-full bg-green-600 text-white py-3 px-6 cursor-pointer rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Quiz...
                    </div>
                  ) : (
                    'Generate Quiz'
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
