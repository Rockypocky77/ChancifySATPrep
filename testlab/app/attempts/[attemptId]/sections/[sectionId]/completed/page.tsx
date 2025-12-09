'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SectionCompletedPage({
  params,
}: {
  params: { attemptId: string; sectionId: string }
}) {
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nextSection, setNextSection] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [params.attemptId])

  async function loadData() {
    try {
      const attemptRes = await fetch(`/api/attempts/${params.attemptId}`)
      if (!attemptRes.ok) throw new Error('Failed to load attempt')
      const attemptData = await attemptRes.json()

      const currentSectionIndex = attemptData.attempt.test.sections.findIndex(
        (s: any) => s.id === params.sectionId
      )
      const nextSectionData =
        currentSectionIndex < attemptData.attempt.test.sections.length - 1
          ? attemptData.attempt.test.sections[currentSectionIndex + 1]
          : null

      setNextSection(nextSectionData)

      // Get section summary
      const sectionAttempt = attemptData.attempt.sectionAttempts.find(
        (sa: any) => sa.sectionId === params.sectionId
      )

      if (sectionAttempt) {
        setSummary({
          rawScore: sectionAttempt.rawScore || 0,
          maxScore: sectionAttempt.maxScore || 0,
          answered: sectionAttempt.answers?.length || 0,
          unanswered: (sectionAttempt.maxScore || 0) - (sectionAttempt.answers?.length || 0),
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleContinue() {
    if (nextSection) {
      router.push(`/attempts/${params.attemptId}/sections/${nextSection.id}`)
    } else {
      router.push(`/attempts/${params.attemptId}/summary`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const percentage = summary && summary.maxScore > 0
    ? Math.round((summary.rawScore / summary.maxScore) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Section Complete!</h1>

          {summary && (
            <div className="mb-6">
              <div className="text-5xl font-bold text-blue-600 mb-2">{percentage}%</div>
              <div className="text-lg text-gray-700">
                {summary.rawScore} / {summary.maxScore} correct
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {summary.answered} answered • {summary.unanswered} unanswered
              </div>
            </div>
          )}

          <div className="mt-8">
            {nextSection ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Next: {nextSection.name} ({nextSection.durationMinutes} minutes)
                </p>
                <button
                  onClick={handleContinue}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Begin Next Section
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">All sections complete!</p>
                <button
                  onClick={handleContinue}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  View Test Summary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

