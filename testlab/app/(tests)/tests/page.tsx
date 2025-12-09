'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Test {
  id: string
  title: string
  description?: string
  totalDurationMinutes?: number
  sectionCount: number
  sections: Array<{
    id: string
    name: string
    durationMinutes: number
    questionCount: number
  }>
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTests()
  }, [])

  async function fetchTests() {
    try {
      const response = await fetch('/api/tests')
      if (!response.ok) throw new Error('Failed to fetch tests')
      const data = await response.json()
      setTests(data.tests)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchTests}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Available Tests</h1>
          <p className="text-gray-600 mt-2">Select a test to begin</p>
        </div>

        {tests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No tests available. Please check back later.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-2">{test.title}</h2>
                {test.description && <p className="text-gray-600 text-sm mb-4">{test.description}</p>}
                <div className="text-sm text-gray-500 mb-4 space-y-1">
                  <div>{test.sectionCount} section{test.sectionCount !== 1 ? 's' : ''}</div>
                  {test.totalDurationMinutes && (
                    <div>Total time: {test.totalDurationMinutes} minutes</div>
                  )}
                </div>
                <Link
                  href={`/tests/${test.id}`}
                  className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Test
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

