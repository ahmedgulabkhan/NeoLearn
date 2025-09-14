'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Brain, BookOpen, FileText, Zap, Upload, MessageCircle, BarChart3, Star } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  const features = [
    {
      title: 'AI Learning',
      description: 'Upload your course materials and chat with an AI tutor that understands your content.',
      icon: BookOpen,
      href: '/ai-learning',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-700'
    },
    {
      title: 'AI Quiz',
      description: 'Generate personalized quizzes from your materials to test your knowledge.',
      icon: FileText,
      href: '/ai-quiz',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-700'
    },
    {
      title: 'AI Flashcards',
      description: 'Create smart flashcards to help you memorize key concepts faster.',
      icon: Brain,
      href: '/ai-flashcards',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-700'
    }
  ]

  const stats = [
    { label: 'Active Learners', value: '10,000+' },
    { label: 'PDFs Processed', value: '50,000+' },
    { label: 'Quizzes Generated', value: '100,000+' },
    { label: 'Success Rate', value: '95%' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Learn Smarter with{' '}
              <span className="text-blue-600">
                AI
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your learning experience with AI-powered tools. Upload your course materials and get personalized quizzes, flashcards, and interactive learning sessions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  href="/ai-learning"
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Learning
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/signin"
                    className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful AI Learning Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to accelerate your learning journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group block"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                  <div className={`${feature.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center text-sm font-semibold text-blue-600">
                    Get Started →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to transform your learning
            </p>
          </div>

          {/* Upload Materials Subsection */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">1. Upload Materials</h3>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Simply drag and drop your PDF course materials, textbooks, or study guides into our platform. 
                  We support all major file formats and automatically process your documents for optimal learning.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600">Support for PDF files</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600">Automatic text extraction and formatting</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600">Secure cloud storage for your materials</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 w-full max-w-md">
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Drag & Drop Files Here</p>
                    <p className="text-sm text-gray-500 mt-2">PDF, DOC, TXT supported</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Processing Subsection */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center order-2 lg:order-1">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 w-full max-w-md">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 text-center">
                    <Zap className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <div className="space-y-2">
                      <div className="h-2 bg-blue-200 rounded-full">
                        <div className="h-2 bg-blue-600 rounded-full w-3/4"></div>
                      </div>
                      <p className="text-sm text-gray-600">Processing your content...</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6 order-1 lg:order-2">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">2. AI Processing</h3>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Our advanced AI analyzes your content, extracts key concepts, and creates personalized learning tools 
                  tailored to your specific materials and learning style.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600">Intelligent content analysis and summarization</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600">Key concept extraction and categorization</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600">Personalized learning path generation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Start Learning Subsection */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">3. Start Learning</h3>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Begin your personalized learning journey with AI-powered tools. Chat with your AI tutor, 
                  take interactive quizzes, and study with smart flashcards - all based on your uploaded materials.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-gray-600">Interactive AI chat for instant help</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-gray-600">Personalized quizzes and assessments</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-gray-600">Smart flashcards for efficient memorization</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 w-full max-w-md">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-100 rounded w-1/2 mt-1"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          <div className="h-2 bg-gray-100 rounded w-3/4 mt-1"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                          <div className="h-2 bg-gray-100 rounded w-1/2 mt-1"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students who are already learning smarter with AI
          </p>
          {user ? (
            <Link
              href="/ai-learning"
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-block"
            >
              Start Learning Now
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </Link>
              <Link
                href="/signin"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
