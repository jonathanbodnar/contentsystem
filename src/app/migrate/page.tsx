'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Database, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function MigratePage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [output, setOutput] = useState<string>('')
  const [error, setError] = useState<string>('')

  const runMigration = async () => {
    setStatus('running')
    setOutput('')
    setError('')

    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setOutput(data.output || 'Migration completed successfully!')
      } else {
        setStatus('error')
        setError(data.error || 'Migration failed')
      }
    } catch (err) {
      setStatus('error')
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <Database className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Database Migration
          </h1>
          <p className="text-gray-600">
            Run this migration to set up the database tables for your writing assistant.
          </p>
        </div>

        <div className="space-y-6">
          {status === 'idle' && (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                This will create the necessary database tables for:
              </p>
              <ul className="text-left text-gray-700 space-y-2 mb-8 max-w-md mx-auto">
                <li>• Document storage and versioning</li>
                <li>• Context library (PDF/DOCX uploads)</li>
                <li>• Ikigai mission context</li>
                <li>• Format management</li>
                <li>• Calendar and scheduling</li>
              </ul>
              <button
                onClick={runMigration}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Run Database Migration
              </button>
            </div>
          )}

          {status === 'running' && (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Running migration...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Migration Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                Your database has been set up successfully. You can now use all features.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-800 mb-2">Migration Output:</h3>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-x-auto">
                  {output}
                </pre>
              </div>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Writing Assistant
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Migration Failed
              </h2>
              <p className="text-gray-600 mb-6">
                There was an error running the migration. Please try again or contact support.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-red-800 mb-2">Error Details:</h3>
                <pre className="text-sm text-red-700 whitespace-pre-wrap overflow-x-auto">
                  {error}
                </pre>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={runMigration}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
