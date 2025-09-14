import Link from 'next/link'
import { Brain, Mail, Github, Twitter, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-3">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                NeoLearn
              </span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md">
              Transform your learning experience with AI-powered tools. Upload your course materials and get personalized quizzes, flashcards, and interactive learning sessions.
            </p>
          </div>

          {/* Features Section */}
          <div className="col-start-4">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/ai-learning"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  AI Learning
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-quiz"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  AI Quiz
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-flashcards"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  AI Flashcards
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 NeoLearn. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Built with ❤️ for better learning
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
