import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/answers
 * Creates or updates an answer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testAttemptId, sectionAttemptId, questionId, selectedAnswer, flagged } = body

    if (!testAttemptId || !sectionAttemptId || !questionId || selectedAnswer === undefined) {
      return NextResponse.json(
        { error: 'testAttemptId, sectionAttemptId, questionId, and selectedAnswer are required' },
        { status: 400 }
      )
    }

    // Normalize selectedAnswer to JSON string
    const selectedAnswerJson =
      typeof selectedAnswer === 'string' ? selectedAnswer : JSON.stringify(selectedAnswer)

    // Upsert answer
    const answer = await prisma.answer.upsert({
      where: {
        testAttemptId_questionId: {
          testAttemptId,
          questionId,
        },
      },
      update: {
        selectedAnswer: selectedAnswerJson,
        flagged: flagged !== undefined ? flagged : undefined,
      },
      create: {
        testAttemptId,
        sectionAttemptId,
        questionId,
        selectedAnswer: selectedAnswerJson,
        flagged: flagged || false,
      },
    })

    return NextResponse.json({ answer }, { status: 201 })
  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }
}

