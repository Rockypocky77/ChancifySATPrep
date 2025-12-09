import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/review/:attemptId/questions/:questionId
 * Returns detailed question review with answer comparison
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string; questionId: string } }
) {
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        answers: {
          where: {
            questionId: params.questionId,
          },
          include: {
            question: {
              include: {
                section: {
                  select: {
                    id: true,
                    name: true,
                    orderIndex: true,
                  },
                },
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
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const answer = attempt.answers[0]
    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    const question = answer.question

    let selectedAnswer: string | string[]
    try {
      selectedAnswer = JSON.parse(answer.selectedAnswer)
    } catch {
      selectedAnswer = answer.selectedAnswer
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

    return NextResponse.json({
      question: {
        id: question.id,
        sectionId: question.sectionId,
        sectionName: question.section.name,
        orderIndex: question.orderIndex,
        questionType: question.questionType,
        prompt: question.prompt,
        choices,
        correctAnswer,
        explanation: question.explanation,
        passage: question.passage,
        metadata: question.metadata ? JSON.parse(question.metadata) : null,
      },
      answer: {
        selectedAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned,
        flagged: answer.flagged,
        timeSpentSeconds: answer.timeSpentSeconds,
      },
    })
  } catch (error) {
    console.error('Error fetching question review:', error)
    return NextResponse.json({ error: 'Failed to fetch question review' }, { status: 500 })
  }
}

