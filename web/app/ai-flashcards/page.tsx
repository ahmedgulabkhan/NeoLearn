'use client'

import React, { useState, useRef } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Upload, FileText, X, Brain, RotateCcw, CheckCircle, XCircle, ArrowLeft, ArrowRight, Shuffle } from 'lucide-react'

interface Flashcard {
  id: string
  front: string
  back: string
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set())
  const [correctCards, setCorrectCards] = useState<Set<string>>(new Set())
  const [incorrectCards, setIncorrectCards] = useState<Set<string>>(new Set())
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

  const generateFlashcards = async () => {
    if (uploadedFiles.length === 0) return

    setIsGenerating(true)
    
    // Simulate flashcard generation
    await new Promise(resolve => setTimeout(resolve, 3000))

    const mockFlashcardSet: FlashcardSet = {
      id: Date.now().toString(),
      title: `Flashcards from ${uploadedFiles[0].name}`,
      totalCards: 8,
      cards: [
        {
          id: '1',
          front: 'What is machine learning?',
          back: 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.',
          category: 'Definitions',
          difficulty: 'easy'
        },
        {
          id: '2',
          front: 'What is the difference between supervised and unsupervised learning?',
          back: 'Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in data without labels.',
          category: 'Concepts',
          difficulty: 'medium'
        },
        {
          id: '3',
          front: 'What is overfitting in machine learning?',
          back: 'Overfitting occurs when a model learns the training data too well, including noise and outliers, resulting in poor performance on new data.',
          category: 'Concepts',
          difficulty: 'hard'
        },
        {
          id: '4',
          front: 'What is cross-validation?',
          back: 'Cross-validation is a technique to assess how well a model generalizes by splitting data into multiple subsets for training and testing.',
          category: 'Techniques',
          difficulty: 'medium'
        },
        {
          id: '5',
          front: 'What is the bias-variance tradeoff?',
          back: 'The bias-variance tradeoff is the balance between a model\'s ability to minimize bias (underfitting) and variance (overfitting).',
          category: 'Concepts',
          difficulty: 'hard'
        },
        {
          id: '6',
          front: 'What is feature engineering?',
          back: 'Feature engineering is the process of selecting, modifying, or creating input variables to improve model performance.',
          category: 'Techniques',
          difficulty: 'medium'
        },
        {
          id: '7',
          front: 'What is regularization?',
          back: 'Regularization is a technique to prevent overfitting by adding a penalty term to the model\'s loss function.',
          category: 'Techniques',
          difficulty: 'hard'
        },
        {
          id: '8',
          front: 'What is the purpose of a validation set?',
          back: 'A validation set is used to tune hyperparameters and evaluate model performance during training, separate from the test set.',
          category: 'Concepts',
          difficulty: 'medium'
        }
      ]
    }

    setFlashcardSet(mockFlashcardSet)
    setCurrentCard(0)
    setIsFlipped(false)
    setShowResults(false)
    setStudiedCards(new Set())
    setCorrectCards(new Set())
    setIncorrectCards(new Set())
    setIsGenerating(false)
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

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
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
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors mr-4"
                >
                  <RotateCcw className="h-4 w-4 inline mr-2" />
                  Create New Set
                </button>
                <button
                  onClick={startStudying}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
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
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
                        {isFlipped ? card.back : card.front}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                      {isFlipped ? 'Show Question' : 'Show Answer'}
                    </button>
                  </div>

                  {isFlipped && (
                    <div className="mt-6 flex justify-center space-x-4">
                      <button
                        onClick={markIncorrect}
                        className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Incorrect
                      </button>
                      <button
                        onClick={markCorrect}
                        className="flex items-center px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
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
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                <button
                  onClick={nextCard}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Upload Materials
              </h2>

              {uploadedFiles.length === 0 ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
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
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
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
                  <div className="inline-flex items-center text-purple-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                    Processing files...
                  </div>
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
                    ? 'Upload PDF files to generate smart flashcards'
                    : `Ready to generate flashcards from ${uploadedFiles.length} file(s)`}
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
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
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
