'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogOut, BookOpen, Brain, FileText } from 'lucide-react'

export default function Header() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              NeoLearn
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/ai-learning"
              className={`flex items-center space-x-1 transition-colors ${
                isActive('/ai-learning')
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>AI Learning</span>
            </Link>
            <Link
              href="/ai-quiz"
              className={`flex items-center space-x-1 transition-colors ${
                isActive('/ai-quiz')
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>AI Quiz</span>
            </Link>
            <Link
              href="/ai-flashcards"
              className={`flex items-center space-x-1 transition-colors ${
                isActive('/ai-flashcards')
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <Brain className="h-4 w-4" />
              <span>AI Flashcards</span>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 cursor-pointer transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/signin"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
              <Link
                href="/ai-learning"
                className={`flex items-center space-x-2 transition-colors block px-3 py-2 rounded-md ${
                  isActive('/ai-learning')
                    ? 'text-blue-600 font-bold bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                <span>AI Learning</span>
              </Link>
              <Link
                href="/ai-quiz"
                className={`flex items-center space-x-2 transition-colors block px-3 py-2 rounded-md ${
                  isActive('/ai-quiz')
                    ? 'text-blue-600 font-bold bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FileText className="h-4 w-4" />
                <span>AI Quiz</span>
              </Link>
              <Link
                href="/ai-flashcards"
                className={`flex items-center space-x-2 transition-colors block px-3 py-2 rounded-md ${
                  isActive('/ai-flashcards')
                    ? 'text-blue-600 font-bold bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Brain className="h-4 w-4" />
                <span>AI Flashcards</span>
              </Link>
              {user ? (
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors w-full px-3 py-2 rounded-md"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <Link
                    href="/signin"
                    className="text-gray-700 hover:text-blue-600 transition-colors block px-3 py-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 block text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
