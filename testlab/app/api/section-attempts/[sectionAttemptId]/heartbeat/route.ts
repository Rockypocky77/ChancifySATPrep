import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateRemainingSeconds } from '@/lib/timer'

/**
 * PATCH /api/section-attempts/:sectionAttemptId/heartbeat
 * Updates remaining time (called periodically from frontend)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sectionAttemptId: string } }
) {
  try {
    const body = await request.json()
    const { remainingSecondsClient } = body

    const sectionAttempt = await prisma.sectionAttempt.findUnique({
      where: { id: params.sectionAttemptId },
      include: {
        section: true,
      },
    })

    if (!sectionAttempt) {
      return NextResponse.json({ error: 'Section attempt not found' }, { status: 404 })
    }

    if (sectionAttempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'Section is not in progress' }, { status: 400 })
    }

    // Calculate server-side remaining time
    const durationSeconds = sectionAttempt.section.durationMinutes * 60
    const serverRemaining = sectionAttempt.startedAt
      ? calculateRemainingSeconds(durationSeconds, sectionAttempt.startedAt)
      : durationSeconds

    // Use the minimum of client and server time (server is source of truth)
    const remainingSeconds = Math.min(remainingSecondsClient, serverRemaining)

    // If time expired, mark as expired
    if (remainingSeconds <= 0) {
      const updated = await prisma.sectionAttempt.update({
        where: { id: params.sectionAttemptId },
        data: {
          status: 'expired',
          completedAt: new Date(),
          remainingSeconds: 0,
          timeSpentSeconds: durationSeconds,
        },
      })

      // Score the section
      await scoreSection(params.sectionAttemptId)

      return NextResponse.json({
        sectionAttempt: updated,
        expired: true,
      })
    }

    const updated = await prisma.sectionAttempt.update({
      where: { id: params.sectionAttemptId },
      data: {
        remainingSeconds,
        timeSpentSeconds: durationSeconds - remainingSeconds,
      },
    })

    return NextResponse.json({
      sectionAttempt: updated,
      expired: false,
    })
  } catch (error) {
    console.error('Error updating heartbeat:', error)
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 })
  }
}

/**
 * Score a section after completion
 */
async function scoreSection(sectionAttemptId: string) {
  const sectionAttempt = await prisma.sectionAttempt.findUnique({
    where: { id: sectionAttemptId },
    include: {
      section: {
        include: {
          questions: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
  })

  if (!sectionAttempt) return

  let rawScore = 0
  let maxScore = sectionAttempt.section.questions.length

  for (const answer of sectionAttempt.answers) {
    if (answer.isCorrect !== null && answer.pointsEarned !== null) {
      rawScore += answer.pointsEarned
    }
  }

  await prisma.sectionAttempt.update({
    where: { id: sectionAttemptId },
    data: {
      rawScore,
      maxScore,
    },
  })
}

