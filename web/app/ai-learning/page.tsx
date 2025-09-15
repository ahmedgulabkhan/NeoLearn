/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import FileUpload from '@/components/FileUpload'
import { Send, MessageCircle, Bot, User } from 'lucide-react'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function AILearning() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [documentsProcessed, setDocumentsProcessed] = useState(0)

  const handleUploadSuccess = (data: any) => {
    setUploadedFiles(prev => [...prev, data.filename])
    setDocumentsProcessed(data.documents_processed)
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Great! I've processed your PDF file "${data.filename}" into ${data.documents_processed} document chunks. I can now help you understand the content. What would you like to know?`,
      isUser: false,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, welcomeMessage])
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    // You could add error handling UI here if needed
  }

  const handleSendMessage = async () => {
    console.log('handleSendMessage called with:', { inputMessage, uploadedFiles })
    if (!inputMessage.trim() || uploadedFiles.length === 0) {
      console.log('Early return - no message or no files')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage('')
    setIsProcessing(true)

    try {
      console.log('Sending message to AI chat API:', currentMessage)
      
      // Send message to AI chat API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentMessage
        })
      })

      console.log('API response status:', response.status)
      const result = await response.json()
      console.log('API response data:', result)

      if (result.success) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: result.response,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiResponse])
      } else {
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `Sorry, I encountered an error: ${result.error}. Please try again.`,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorResponse])
      }
    } catch (error) {
      console.error('Fetch error:', error)
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting to the AI service. Please check your connection and try again.",
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    }

    setIsProcessing(false)
  }

  const clearFiles = () => {
    setUploadedFiles([])
    setMessages([])
    setDocumentsProcessed(0)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Learning</h1>
            <p className="text-gray-600">
              Upload your course materials and chat with an AI tutor that understands your content
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    Upload Materials
                  </h2>
                  {uploadedFiles.length > 0 && (
                    <button
                      onClick={clearFiles}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
            </div>

            {/* Chat Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-gray-700" />
                    AI Tutor Chat
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Ask questions about your uploaded materials
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>Upload some PDF files to start chatting with the AI tutor</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            message.isUser
                              ? 'bg-gray-800 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-start">
                            {!message.isUser && (
                              <Bot className="h-5 w-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm" style={{ whiteSpace: "pre-line" }}>{message.text}</p>
                              <p className={`text-xs mt-1 ${
                                message.isUser ? 'text-gray-300' : 'text-gray-500'
                              }`}>
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                            {message.isUser && (
                              <User className="h-5 w-5 text-gray-300 ml-2 mt-0.5 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl">
                        <div className="flex items-center">
                          <Bot className="h-5 w-5 text-gray-600 mr-2" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        uploadedFiles.length === 0
                          ? "Upload files first to start chatting..."
                          : "Ask a question about your materials..."
                      }
                      disabled={uploadedFiles.length === 0 || isProcessing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 bg-white"
                    />
                    <button
                      onClick={() => {
                        console.log('Send button clicked')
                        handleSendMessage()
                      }}
                      disabled={!inputMessage.trim() || uploadedFiles.length === 0 || isProcessing}
                      className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
