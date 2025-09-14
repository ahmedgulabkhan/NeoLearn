'use client'

import React, { useState, useRef } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Upload, FileText, X, Play, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react'

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return

    setIsUploading(true)
    
    // Simulate file upload processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newFiles = Array.from(files).filter(file => file.type === 'application/pdf')
    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsUploading(false)
  }

  const generateQuiz = async () => {
    if (uploadedFiles.length === 0) return

    setIsGenerating(true)
    
    // Simulate quiz generation
    await new Promise(resolve => setTimeout(resolve, 3000))

    const mockQuiz: Quiz = {
      id: Date.now().toString(),
      title: `Quiz from ${uploadedFiles[0].name}`,
      timeLimit: 30, // 30 minutes
      questions: [
        {
          id: '1',
          question: 'What is the main topic discussed in the uploaded material?',
          options: [
            'Machine Learning Fundamentals',
            'Data Structures and Algorithms',
            'Web Development Best Practices',
            'Database Design Principles'
          ],
          correctAnswer: 0,
          explanation: 'The material primarily focuses on machine learning fundamentals, covering basic concepts and applications.'
        },
        {
          id: '2',
          question: 'Which of the following is NOT a supervised learning algorithm?',
          options: [
            'Linear Regression',
            'Decision Trees',
            'K-Means Clustering',
            'Random Forest'
          ],
          correctAnswer: 2,
          explanation: 'K-Means Clustering is an unsupervised learning algorithm, while the others are supervised learning methods.'
        },
        {
          id: '3',
          question: 'What is the primary advantage of using cross-validation?',
          options: [
            'Reduces training time',
            'Prevents overfitting',
            'Increases model accuracy',
            'Simplifies data preprocessing'
          ],
          correctAnswer: 1,
          explanation: 'Cross-validation helps prevent overfitting by providing a more robust estimate of model performance on unseen data.'
        }
      ]
    }

    setQuiz(mockQuiz)
    setTimeLeft(mockQuiz.timeLimit! * 60) // Convert to seconds
    setIsGenerating(false)
  }

  const startQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers(new Array(quiz!.questions.length).fill(-1))
    setShowResults(false)
    setTimeLeft(quiz!.timeLimit! * 60)
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
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
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
                <p className="text-gray-600">Here's how you performed</p>
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
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
                >
                  <RotateCcw className="h-4 w-4 inline mr-2" />
                  Take Another Quiz
                </button>
                <button
                  onClick={() => setShowResults(false)}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
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
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
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
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={nextQuestion}
                  disabled={selectedAnswers[currentQuestion] === -1}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Upload Materials
              </h2>

              {uploadedFiles.length === 0 ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload PDF files</p>
                  <p className="text-sm text-gray-500">or drag and drop them here</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm text-gray-700 truncate max-w-32">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
                  >
                    + Add more files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              )}

              {isUploading && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center text-green-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    Processing files...
                  </div>
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
                    ? 'Upload PDF files to generate a personalized quiz'
                    : `Ready to generate quiz from ${uploadedFiles.length} file(s)`}
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
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
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
