import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/review/:attemptId/questions
 * Returns questions with user answers for review
 * Query params: sectionId (optional), filter (all|correct|incorrect|flagged)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')
    const filter = searchParams.get('filter') || 'all'

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        sectionAttempts: {
          where: sectionId ? { sectionId } : undefined,
          include: {
            section: {
              include: {
                questions: {
                  orderBy: {
                    orderIndex: 'asc',
                  },
                  include: {
                    passage: {
                      select: {
                        id: true,
                        title: true,
                        text: true,
                        orderIndex: true,
                      },
                    },
                  },
                },
              },
            },
            answers: {
              include: {
                question: true,
              },
            },
          },
          orderBy: {
            section: {
              orderIndex: 'asc',
            },
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const reviewQuestions: any[] = []

    for (const sectionAttempt of attempt.sectionAttempts) {
      for (const question of sectionAttempt.section.questions) {
        const answer = sectionAttempt.answers.find((a) => a.questionId === question.id)

        // Apply filters
        if (filter === 'correct' && answer?.isCorrect !== true) continue
        if (filter === 'incorrect' && answer?.isCorrect !== false) continue
        if (filter === 'flagged' && answer?.flagged !== true) continue

        let selectedAnswer: string | string[] = ''
        try {
          selectedAnswer = answer ? JSON.parse(answer.selectedAnswer) : ''
        } catch {
          selectedAnswer = answer?.selectedAnswer || ''
        }

        let correctAnswer: string | string[]
        try {
          correctAnswer = JSON.parse(question.correctAnswer)
        } catch {
          correctAnswer = question.correctAnswer
        }

        let choices: any[] = []
        if (question.choices) {
          try {
            choices = JSON.parse(question.choices)
          } catch {
            choices = []
          }
        }

        reviewQuestions.push({
          questionId: question.id,
          sectionId: sectionAttempt.sectionId,
          sectionName: sectionAttempt.section.name,
          orderIndex: question.orderIndex,
          questionType: question.questionType,
          prompt: question.prompt,
          choices,
          correctAnswer,
          selectedAnswer,
          isCorrect: answer?.isCorrect ?? null,
          flagged: answer?.flagged || false,
          pointsEarned: answer?.pointsEarned || 0,
          timeSpentSeconds: answer?.timeSpentSeconds,
          explanation: question.explanation,
          passage: question.passage,
          metadata: question.metadata ? JSON.parse(question.metadata) : null,
        })
      }
    }

    return NextResponse.json({ questions: reviewQuestions })
  } catch (error) {
    console.error('Error fetching review questions:', error)
    return NextResponse.json({ error: 'Failed to fetch review questions' }, { status: 500 })
  }
}

