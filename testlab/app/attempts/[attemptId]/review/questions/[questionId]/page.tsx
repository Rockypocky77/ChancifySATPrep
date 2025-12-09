'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface QuestionDetail {
  question: {
    id: string
    sectionId: string
    sectionName: string
    orderIndex: number
    questionType: string
    prompt: string
    choices: Array<{ key: string; text: string }> | null
    correctAnswer: string | string[]
    explanation: string | null
    passage: {
      id: string
      title: string | null
      text: string
    } | null
    metadata: any
  }
  answer: {
    selectedAnswer: string | string[]
    isCorrect: boolean | null
    pointsEarned: number
    flagged: boolean
    timeSpentSeconds: number | null
  }
}

export default function QuestionReviewPage({
  params,
}: {
  params: { attemptId: string; questionId: string }
}) {
  const router = useRouter()
  const [data, setData] = useState<QuestionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuestion()
  }, [params.attemptId, params.questionId])

  async function loadQuestion() {
    try {
      const response = await fetch(
        `/api/review/${params.attemptId}/questions/${params.questionId}`
      )
      if (!response.ok) throw new Error('Failed to load question')
      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Error loading question:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load question</p>
          <Link href={`/attempts/${params.attemptId}/review`} className="text-blue-600 hover:text-blue-700">
            Back to Review
          </Link>
        </div>
      </div>
    )
  }

  const { question, answer } = data
  const selectedAnswer = answer.selectedAnswer || ''
  const correctAnswer = question.correctAnswer

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href={`/attempts/${params.attemptId}/review`}
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Review
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="mb-6 pb-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {question.sectionName} - Question {question.orderIndex + 1}
                </h1>
                {question.metadata?.skill && (
                  <p className="text-sm text-gray-600 mt-1">Skill: {question.metadata.skill}</p>
                )}
              </div>
              <div
                className={`
                  px-4 py-2 rounded-lg font-semibold
                  ${answer.isCorrect === true ? 'bg-green-100 text-green-700' : ''}
                  ${answer.isCorrect === false ? 'bg-red-100 text-red-700' : ''}
                  ${answer.isCorrect === null ? 'bg-gray-100 text-gray-700' : ''}
                `}
              >
                {answer.isCorrect === true ? 'Correct' : answer.isCorrect === false ? 'Incorrect' : 'Unanswered'}
              </div>
            </div>
            {answer.timeSpentSeconds && (
              <p className="text-sm text-gray-600">
                Time spent: {Math.floor(answer.timeSpentSeconds / 60)}m {answer.timeSpentSeconds % 60}s
              </p>
            )}
          </div>

          {/* Passage */}
          {question.passage && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              {question.passage.title && (
                <h3 className="font-semibold mb-2">{question.passage.title}</h3>
              )}
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{question.passage.text}</div>
            </div>
          )}

          {/* Question */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Question</h2>
            <p className="text-gray-900 mb-4">{question.prompt}</p>

            {/* Choices */}
            {question.choices && (
              <div className="space-y-2">
                {question.choices.map((choice) => {
                  const isSelected =
                    selectedAnswer === choice.key ||
                    (Array.isArray(selectedAnswer) && selectedAnswer.includes(choice.key))
                  const isCorrect =
                    correctAnswer === choice.key ||
                    (Array.isArray(correctAnswer) && correctAnswer.includes(choice.key))

                  return (
                    <div
                      key={choice.key}
                      className={`
                        p-3 border-2 rounded-lg
                        ${isCorrect ? 'border-green-500 bg-green-50' : ''}
                        ${isSelected && !isCorrect ? 'border-red-500 bg-red-50' : ''}
                        ${!isSelected && !isCorrect ? 'border-gray-200' : ''}
                      `}
                    >
                      <div className="flex items-start">
                        <span className="font-medium mr-2">{choice.key}.</span>
                        <span>{choice.text}</span>
                        {isCorrect && (
                          <span className="ml-auto text-green-600 font-semibold">✓ Correct</span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="ml-auto text-red-600 font-semibold">✗ Your Answer</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Free Response */}
            {question.questionType === 'free_response' && (
              <div className="space-y-3">
                <div className="p-3 border-2 border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Your Answer:</div>
                  <div className="font-medium">
                    {selectedAnswer || '(no response)'}
                  </div>
                </div>
                <div className="p-3 border-2 border-green-500 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Correct Answer:</div>
                  <div className="font-medium">{String(correctAnswer)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">Explanation</h3>
              <div className="text-gray-700 whitespace-pre-wrap">{question.explanation}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

