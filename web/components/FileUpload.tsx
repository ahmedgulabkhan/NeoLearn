/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useRef } from 'react'
import { Upload, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react'

interface FileUploadProps {
  onUploadSuccess?: (data: any) => void
  onUploadError?: (error: string) => void
  className?: string
  disabled?: boolean
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error'
  message: string
  filename?: string
}

export default function FileUpload({ 
  onUploadSuccess, 
  onUploadError, 
  className = '',
  disabled = false 
}: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    message: ''
  })
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      const error = 'Only PDF files are allowed'
      setUploadStatus({
        status: 'error',
        message: error
      })
      onUploadError?.(error)
      return
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      const error = 'File size must be less than 10MB'
      setUploadStatus({
        status: 'error',
        message: error
      })
      onUploadError?.(error)
      return
    }

    setUploadStatus({
      status: 'uploading',
      message: 'Uploading and processing document...',
      filename: file.name
    })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setUploadStatus({
          status: 'success',
          message: `Successfully uploaded ${file.name}. Processed ${result.documents_processed} document chunks.`,
          filename: file.name
        })
        onUploadSuccess?.(result)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadStatus({
        status: 'error',
        message: errorMessage
      })
      onUploadError?.(errorMessage)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || uploadStatus.status === 'uploading') return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const handleClick = () => {
    if (disabled || uploadStatus.status === 'uploading') return
    fileInputRef.current?.click()
  }

  const resetUpload = () => {
    setUploadStatus({ status: 'idle', message: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'uploading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />
      default:
        return <Upload className="h-8 w-8 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (uploadStatus.status) {
      case 'uploading':
        return 'border-blue-300 bg-blue-50'
      case 'success':
        return 'border-green-300 bg-green-50'
      case 'error':
        return 'border-red-300 bg-red-50'
      default:
        return dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${getStatusColor()}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploadStatus.status === 'uploading'}
        />

        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}
          
          <div className="space-y-2">
            {uploadStatus.status === 'idle' ? (
              <>
                <p className="text-lg font-medium text-gray-700">
                  Drop your PDF file here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF files up to 4MB
                </p>
              </>
            ) : (
              <>
                <p className={`text-lg font-medium ${
                  uploadStatus.status === 'success' ? 'text-green-700' :
                  uploadStatus.status === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {uploadStatus.message}
                </p>
                {uploadStatus.filename && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{uploadStatus.filename}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {(uploadStatus.status === 'success' || uploadStatus.status === 'error') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                resetUpload()
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upload Another File
            </button>
          )}
        </div>
      </div>

      {uploadStatus.status === 'success' && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-800 font-medium">
              Document successfully processed and ready for AI interactions!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
