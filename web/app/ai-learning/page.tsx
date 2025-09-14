'use client'

import { useState, useRef } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Upload, Send, FileText, MessageCircle, X, Bot, User } from 'lucide-react'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function AILearning() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return

    setIsUploading(true)
    
    // Simulate file upload processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newFiles = Array.from(files).filter(file => file.type === 'application/pdf')
    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsUploading(false)

    // Add welcome message
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Great! I've processed ${newFiles.length} PDF file(s). I can now help you understand the content. What would you like to know?`,
      isUser: false,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, welcomeMessage])
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || uploadedFiles.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsProcessing(true)

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500))

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: "I understand your question about the uploaded material. Based on the content I've analyzed, here's what I can tell you... (This is a simulated response. In a real implementation, this would connect to your AI service to process the PDF content and generate contextual responses.)",
      isUser: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, aiResponse])
    setIsProcessing(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
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
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-700" />
                  Upload Materials
                </h2>

                {uploadedFiles.length === 0 ? (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
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
                          <FileText className="h-4 w-4 text-gray-600 mr-2" />
                          <span className="text-sm text-gray-700 truncate max-w-32">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
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
                    <div className="inline-flex items-center text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Processing files...
                    </div>
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
                              <p className="text-sm">{message.text}</p>
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
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleSendMessage}
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
