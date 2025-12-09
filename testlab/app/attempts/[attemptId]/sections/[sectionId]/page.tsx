'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SectionTimer } from '@/components/SectionTimer'
import { QuestionGrid } from '@/components/QuestionGrid'

interface Choice {
  key: string
  text: string
}

interface Question {
  id: string
  orderIndex: number
  questionType: string
  prompt: string
  choices: Choice[] | null
  passageId: string | null
}

interface Passage {
  id: string
  title: string | null
  text: string
  orderIndex: number
}

export default function SectionTestPage({
  params,
}: {
  params: { attemptId: string; sectionId: string }
}) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [passages, setPassages] = useState<Passage[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [sectionAttemptId, setSectionAttemptId] = useState<string | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [sectionAttempt, setSectionAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSection()
  }, [params.sectionId])

  async function loadSection() {
    try {
      // Find section attempt
      const attemptRes = await fetch(`/api/attempts/${params.attemptId}`)
      if (!attemptRes.ok) throw new Error('Failed to load attempt')
      const attemptData = await attemptRes.json()
      
      const sectionAttempt = attemptData.attempt.sectionAttempts.find(
        (sa: any) => sa.sectionId === params.sectionId
      )

      if (!sectionAttempt) throw new Error('Section attempt not found')

      setSectionAttemptId(sectionAttempt.id)

      // Start section and get questions
      const startRes = await fetch(`/api/section-attempts/${sectionAttempt.id}/start`, {
        method: 'POST',
      })

      if (!startRes.ok) throw new Error('Failed to start section')
      const startData = await startRes.json()

      setQuestions(startData.questions)
      setPassages(startData.passages)
      setRemainingSeconds(startData.sectionAttempt.remainingSeconds || 0)
      setSectionAttempt(startData.sectionAttempt)

      // Load existing answers
      const existingAnswers: Record<string, string | string[]> = {}
      const existingFlagged = new Set<string>()

      for (const answer of startData.sectionAttempt.answers || []) {
        try {
          existingAnswers[answer.questionId] = JSON.parse(answer.selectedAnswer)
        } catch {
          existingAnswers[answer.questionId] = answer.selectedAnswer
        }
        if (answer.flagged) {
          existingFlagged.add(answer.questionId)
        }
      }

      setAnswers(existingAnswers)
      setFlagged(existingFlagged)
    } catch (error) {
      console.error('Error loading section:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveAnswer(questionId: string, answer: string | string[]) {
    if (!sectionAttemptId) return

    setAnswers((prev) => ({ ...prev, [questionId]: answer }))

    try {
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testAttemptId: params.attemptId,
          sectionAttemptId,
          questionId,
          selectedAnswer: answer,
        }),
      })
    } catch (error) {
      console.error('Failed to save answer:', error)
    }
  }

  async function toggleFlag(questionId: string) {
    const newFlagged = new Set(flagged)
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId)
    } else {
      newFlagged.add(questionId)
    }
    setFlagged(newFlagged)

    // Find answer ID and update flag
    // For now, just save via answer endpoint
    const answer = answers[questionId] || ''
    await saveAnswer(questionId, answer)
  }

  async function handleSubmit() {
    if (!sectionAttemptId) return

    const unansweredCount = questions.length - Object.keys(answers).length
    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered question${unansweredCount !== 1 ? 's' : ''}. Submit anyway?`
      )
      if (!confirm) return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/section-attempts/${sectionAttemptId}/complete`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to submit section')

      // Navigate to completed page
      router.push(`/attempts/${params.attemptId}/sections/${params.sectionId}/completed`)
    } catch (error) {
      console.error('Error submitting section:', error)
      alert('Failed to submit section. Please try again.')
      setSubmitting(false)
    }
  }

  function handleTimerExpire() {
    handleSubmit()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading section...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const currentPassage = currentQuestion?.passageId
    ? passages.find((p) => p.id === currentQuestion.passageId)
    : null

  const answeredQuestions = new Set(
    Object.keys(answers).map((qId) => {
      const q = questions.findIndex((q) => q.id === qId)
      return q >= 0 ? q + 1 : 0
    })
  )

  const flaggedQuestionNumbers = new Set(
    Array.from(flagged)
      .map((qId) => {
        const q = questions.findIndex((q) => q.id === qId)
        return q >= 0 ? q + 1 : 0
      })
      .filter((n) => n > 0)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold">
                Section {currentQuestionIndex + 1} of {questions.length}
              </h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            {sectionAttemptId && (
              <SectionTimer
                sectionAttemptId={sectionAttemptId}
                initialSeconds={remainingSeconds}
                onExpire={handleTimerExpire}
              />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Passage */}
              {currentPassage && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  {currentPassage.title && (
                    <h3 className="font-semibold mb-2">{currentPassage.title}</h3>
                  )}
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{currentPassage.text}</div>
                </div>
              )}

              {/* Question */}
              {currentQuestion && (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Question {currentQuestion.orderIndex + 1}
                      </span>
                      <button
                        onClick={() => toggleFlag(currentQuestion.id)}
                        className={`text-sm px-2 py-1 rounded ${
                          flagged.has(currentQuestion.id)
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {flagged.has(currentQuestion.id) ? '⚑ Flagged' : '⚐ Flag'}
                      </button>
                    </div>
                    <p className="text-gray-900">{currentQuestion.prompt}</p>
                  </div>

                  {/* Choices */}
                  {currentQuestion.choices && (
                    <div className="space-y-2">
                      {currentQuestion.choices.map((choice) => {
                        const isSelected =
                          currentAnswer === choice.key ||
                          (Array.isArray(currentAnswer) && currentAnswer.includes(choice.key))

                        return (
                          <label
                            key={choice.key}
                            className={`
                              block p-3 border-2 rounded-lg cursor-pointer transition-colors
                              ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                            `}
                          >
                            <input
                              type={currentQuestion.questionType === 'multiple_select' ? 'checkbox' : 'radio'}
                              name={`question-${currentQuestion.id}`}
                              value={choice.key}
                              checked={isSelected}
                              onChange={(e) => {
                                if (currentQuestion.questionType === 'multiple_select') {
                                  const current = Array.isArray(currentAnswer) ? currentAnswer : []
                                  const newAnswer = e.target.checked
                                    ? [...current, choice.key]
                                    : current.filter((k) => k !== choice.key)
                                  saveAnswer(currentQuestion.id, newAnswer)
                                } else {
                                  saveAnswer(currentQuestion.id, choice.key)
                                }
                              }}
                              className="mr-3"
                            />
                            <span className="font-medium">{choice.key}.</span> {choice.text}
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* Free Response */}
                  {currentQuestion.questionType === 'free_response' && (
                    <input
                      type="text"
                      value={currentAnswer as string || ''}
                      onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your answer"
                    />
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))
                  }
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <QuestionGrid
              totalQuestions={questions.length}
              currentQuestionIndex={currentQuestionIndex}
              answeredQuestions={answeredQuestions}
              flaggedQuestions={flaggedQuestionNumbers}
              onQuestionClick={(index) => setCurrentQuestionIndex(index)}
            />

            <div className="mt-4 bg-white rounded-lg shadow-md p-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Section'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

