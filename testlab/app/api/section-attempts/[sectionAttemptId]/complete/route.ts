import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateRemainingSeconds } from '@/lib/timer'
import { scoreAnswer } from '@/lib/scoring'

/**
 * POST /api/section-attempts/:sectionAttemptId/complete
 * Completes a section attempt and scores all answers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sectionAttemptId: string } }
) {
  try {
    const sectionAttempt = await prisma.sectionAttempt.findUnique({
      where: { id: params.sectionAttemptId },
      include: {
        section: {
          include: {
            questions: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        testAttempt: {
          include: {
            test: {
              include: {
                sections: {
                  orderBy: {
                    orderIndex: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!sectionAttempt) {
      return NextResponse.json({ error: 'Section attempt not found' }, { status: 404 })
    }

    const now = new Date()
    const durationSeconds = sectionAttempt.section.durationMinutes * 60
    const timeSpent = sectionAttempt.startedAt
      ? Math.min(durationSeconds, calculateRemainingSeconds(durationSeconds, sectionAttempt.startedAt, now))
      : 0

    // Score all answers
    let rawScore = 0
    let maxScore = sectionAttempt.section.questions.length

    for (const question of sectionAttempt.section.questions) {
      const answer = sectionAttempt.answers.find((a) => a.questionId === question.id)

      if (answer) {
        // Parse answers
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

        const result = scoreAnswer(
          selectedAnswer,
          correctAnswer,
          question.questionType as any
        )

        await prisma.answer.update({
          where: { id: answer.id },
          data: {
            isCorrect: result.isCorrect,
            pointsEarned: result.pointsEarned,
          },
        })

        rawScore += result.pointsEarned
      } else {
        // Unanswered question = 0 points
        rawScore += 0
      }
    }

    // Update section attempt
    const updated = await prisma.sectionAttempt.update({
      where: { id: params.sectionAttemptId },
      data: {
        status: 'completed',
        completedAt: now,
        timeSpentSeconds: durationSeconds - (sectionAttempt.remainingSeconds || 0),
        remainingSeconds: 0,
        rawScore,
        maxScore,
      },
    })

    // Check if all sections are complete
    const allSectionAttempts = await prisma.sectionAttempt.findMany({
      where: {
        testAttemptId: sectionAttempt.testAttemptId,
      },
    })

    const allComplete = allSectionAttempts.every(
      (sa) => sa.status === 'completed' || sa.status === 'expired'
    )

    if (allComplete) {
      // Calculate total scores
      const totalRawScore = allSectionAttempts.reduce((sum, sa) => sum + (sa.rawScore || 0), 0)
      const totalMaxScore = allSectionAttempts.reduce((sum, sa) => sum + (sa.maxScore || 0), 0)

      await prisma.testAttempt.update({
        where: { id: sectionAttempt.testAttemptId },
        data: {
          status: 'completed',
          completedAt: now,
          rawScore: totalRawScore,
          maxScore: totalMaxScore,
        },
      })
    }

    return NextResponse.json({
      sectionAttempt: updated,
      summary: {
        rawScore,
        maxScore,
        percentage: maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0,
        answered: sectionAttempt.answers.length,
        unanswered: maxScore - sectionAttempt.answers.length,
      },
    })
  } catch (error) {
    console.error('Error completing section:', error)
    return NextResponse.json({ error: 'Failed to complete section' }, { status: 500 })
  }
}

