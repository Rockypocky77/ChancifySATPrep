import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/review/:attemptId/summary
 * Returns review summary with per-section stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        sectionAttempts: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                orderIndex: true,
              },
            },
            answers: true,
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

    const sectionStats = attempt.sectionAttempts.map((sa) => {
      const correct = sa.answers.filter((a) => a.isCorrect === true).length
      const incorrect = sa.answers.filter((a) => a.isCorrect === false).length
      const unanswered = (sa.maxScore || 0) - sa.answers.length
      const flagged = sa.answers.filter((a) => a.flagged).length

      return {
        sectionId: sa.sectionId,
        sectionName: sa.section.name,
        orderIndex: sa.section.orderIndex,
        rawScore: sa.rawScore || 0,
        maxScore: sa.maxScore || 0,
        correct,
        incorrect,
        unanswered,
        flagged,
        timeSpentSeconds: sa.timeSpentSeconds || 0,
      }
    })

    const totalCorrect = sectionStats.reduce((sum, s) => sum + s.correct, 0)
    const totalIncorrect = sectionStats.reduce((sum, s) => sum + s.incorrect, 0)
    const totalUnanswered = sectionStats.reduce((sum, s) => sum + s.unanswered, 0)
    const totalFlagged = sectionStats.reduce((sum, s) => sum + s.flagged, 0)

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        rawScore: attempt.rawScore || 0,
        maxScore: attempt.maxScore || 0,
        totalTimeSpentSeconds: attempt.totalTimeSpentSeconds || 0,
      },
      sectionStats,
      totals: {
        correct: totalCorrect,
        incorrect: totalIncorrect,
        unanswered: totalUnanswered,
        flagged: totalFlagged,
      },
    })
  } catch (error) {
    console.error('Error fetching review summary:', error)
    return NextResponse.json({ error: 'Failed to fetch review summary' }, { status: 500 })
  }
}

