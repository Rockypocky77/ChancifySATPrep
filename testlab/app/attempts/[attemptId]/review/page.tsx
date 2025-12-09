'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface ReviewQuestion {
  questionId: string
  sectionId: string
  sectionName: string
  orderIndex: number
  questionType: string
  prompt: string
  choices: Array<{ key: string; text: string }> | null
  correctAnswer: string | string[]
  selectedAnswer: string | string[]
  isCorrect: boolean | null
  flagged: boolean
  pointsEarned: number
  explanation: string | null
  passage: {
    id: string
    title: string | null
    text: string
  } | null
}

export default function ReviewPage({ params }: { params: { attemptId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [filter, setFilter] = useState<string>(searchParams.get('filter') || 'all')

  useEffect(() => {
    loadQuestions()
  }, [params.attemptId, selectedSection, filter])

  async function loadQuestions() {
    try {
      const queryParams = new URLSearchParams()
      if (selectedSection !== 'all') {
        queryParams.append('sectionId', selectedSection)
      }
      if (filter !== 'all') {
        queryParams.append('filter', filter)
      }

      const response = await fetch(`/api/review/${params.attemptId}/questions?${queryParams}`)
      if (!response.ok) throw new Error('Failed to load questions')
      const data = await response.json()
      setQuestions(data.questions)
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const sections = Array.from(new Set(questions.map((q) => q.sectionName)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/attempts/${params.attemptId}/summary`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Summary
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Review Questions</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Section:</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="border rounded-lg px-3 py-1"
              >
                <option value="all">All Sections</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border rounded-lg px-3 py-1"
              >
                <option value="all">All Questions</option>
                <option value="correct">Correct Only</option>
                <option value="incorrect">Incorrect Only</option>
                <option value="flagged">Flagged Only</option>
              </select>
            </div>
            <div className="ml-auto text-sm text-gray-600">
              Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No questions match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.questionId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() =>
                  router.push(
                    `/attempts/${params.attemptId}/review/questions/${question.questionId}`
                  )
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                        ${question.isCorrect === true ? 'bg-green-100 text-green-700' : ''}
                        ${question.isCorrect === false ? 'bg-red-100 text-red-700' : ''}
                        ${question.isCorrect === null ? 'bg-gray-100 text-gray-700' : ''}
                      `}
                    >
                      {question.isCorrect === true ? '✓' : question.isCorrect === false ? '✗' : '○'}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {question.sectionName} - Question {question.orderIndex + 1}
                      </div>
                      <div className="text-sm text-gray-600">
                        {question.pointsEarned > 0 ? `${question.pointsEarned} point` : '0 points'}
                        {question.flagged && ' • ⚑ Flagged'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-gray-700 line-clamp-2">{question.prompt}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

