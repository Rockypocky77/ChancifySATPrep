'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Section {
  id: string
  name: string
  orderIndex: number
  durationMinutes: number
  instructions?: string
  questionCount: number
}

interface Test {
  id: string
  title: string
  description?: string
  totalDurationMinutes?: number
  sections: Section[]
}

export default function TestIntroPage({ params }: { params: { testId: string } }) {
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTest()
  }, [params.testId])

  async function fetchTest() {
    try {
      const response = await fetch(`/api/tests/${params.testId}`)
      if (!response.ok) throw new Error('Failed to fetch test')
      const data = await response.json()
      setTest(data.test)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test')
    } finally {
      setLoading(false)
    }
  }

  async function handleStart() {
    setStarting(true)
    try {
      // For now, use a placeholder userId. In production, get from auth.
      const userId = 'user-1' // TODO: Get from auth context

      const response = await fetch(`/api/tests/${params.testId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.attemptId) {
          // Resume existing attempt
          router.push(`/attempts/${error.attemptId}/sections/${test!.sections[0].id}`)
          return
        }
        throw new Error(error.error || 'Failed to start test')
      }

      const data = await response.json()
      const firstSection = test!.sections[0]
      router.push(`/attempts/${data.attempt.id}/sections/${firstSection.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test')
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    )
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || 'Test not found'}</p>
          <Link href="/tests" className="text-blue-600 hover:text-blue-700">
            Back to Tests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/tests" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Tests
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{test.title}</h1>
          {test.description && <p className="text-gray-600 mb-6">{test.description}</p>}

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Test Structure</h2>
            <div className="space-y-4">
              {test.sections.map((section) => (
                <div key={section.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Section {section.orderIndex + 1}: {section.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {section.questionCount} questions • {section.durationMinutes} minutes
                      </p>
                      {section.instructions && (
                        <p className="text-gray-500 text-sm mt-2">{section.instructions}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold mb-2">Instructions</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
              <li>Each section has a time limit. The timer will start when you begin.</li>
              <li>You can navigate between questions within a section.</li>
              <li>Answers are saved automatically.</li>
              <li>You can flag questions to review later.</li>
              <li>Once you submit a section, you cannot return to it.</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={starting}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? 'Starting...' : 'Begin Section 1'}
          </button>
        </div>
      </div>
    </div>
  )
}

