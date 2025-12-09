'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SectionStat {
  sectionId: string
  sectionName: string
  orderIndex: number
  rawScore: number
  maxScore: number
  correct: number
  incorrect: number
  unanswered: number
  flagged: number
  timeSpentSeconds: number
}

interface Summary {
  attempt: {
    id: string
    status: string
    rawScore: number
    maxScore: number
    totalTimeSpentSeconds: number
  }
  sectionStats: SectionStat[]
  totals: {
    correct: number
    incorrect: number
    unanswered: number
    flagged: number
  }
}

export default function TestSummaryPage({ params }: { params: { attemptId: string } }) {
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [params.attemptId])

  async function loadSummary() {
    try {
      const response = await fetch(`/api/review/${params.attemptId}/summary`)
      if (!response.ok) throw new Error('Failed to load summary')
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error('Error loading summary:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading summary...</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load summary</p>
          <Link href="/tests" className="text-blue-600 hover:text-blue-700">
            Back to Tests
          </Link>
        </div>
      </div>
    )
  }

  const overallPercentage =
    summary.attempt.maxScore > 0
      ? Math.round((summary.attempt.rawScore / summary.attempt.maxScore) * 100)
      : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Complete!</h1>
          <p className="text-gray-600 mb-6">Here's your performance summary</p>

          {/* Overall Score */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{overallPercentage}%</div>
              <div className="text-lg text-gray-700">
                {summary.attempt.rawScore} / {summary.attempt.maxScore} correct
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Total time: {formatTime(summary.attempt.totalTimeSpentSeconds)}
              </div>
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Section Breakdown</h2>
            <div className="space-y-4">
              {summary.sectionStats.map((stat) => {
                const sectionPercentage =
                  stat.maxScore > 0 ? Math.round((stat.rawScore / stat.maxScore) * 100) : 0

                return (
                  <div key={stat.sectionId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Section {stat.orderIndex + 1}: {stat.sectionName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {stat.rawScore} / {stat.maxScore} correct ({sectionPercentage}%)
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {formatTime(stat.timeSpentSeconds)}
                      </div>
                    </div>
                    <div className="flex space-x-4 text-sm mt-3">
                      <span className="text-green-600">✓ {stat.correct} correct</span>
                      <span className="text-red-600">✗ {stat.incorrect} incorrect</span>
                      <span className="text-gray-600">○ {stat.unanswered} unanswered</span>
                      {stat.flagged > 0 && (
                        <span className="text-yellow-600">⚑ {stat.flagged} flagged</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Overall Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.totals.correct}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.totals.incorrect}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{summary.totals.unanswered}</div>
                <div className="text-sm text-gray-600">Unanswered</div>
              </div>
              {summary.totals.flagged > 0 && (
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{summary.totals.flagged}</div>
                  <div className="text-sm text-gray-600">Flagged</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/attempts/${params.attemptId}/review`}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            Review All Questions
          </Link>
          <Link
            href={`/attempts/${params.attemptId}/review?filter=incorrect`}
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center"
          >
            Review Incorrect Only
          </Link>
          <Link
            href="/tests"
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
          >
            Back to Tests
          </Link>
        </div>
      </div>
    </div>
  )
}

