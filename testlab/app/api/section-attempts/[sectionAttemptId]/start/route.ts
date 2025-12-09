import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/section-attempts/:sectionAttemptId/start
 * Starts a section attempt and returns questions + passages
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
            passages: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
      },
    })

    if (!sectionAttempt) {
      return NextResponse.json({ error: 'Section attempt not found' }, { status: 404 })
    }

    // If already started, just return the data
    if (sectionAttempt.status === 'in_progress') {
      return NextResponse.json({
        sectionAttempt,
        questions: sectionAttempt.section.questions,
        passages: sectionAttempt.section.passages,
      })
    }

    // Start the section
    const now = new Date()
    const durationSeconds = sectionAttempt.section.durationMinutes * 60

    const updated = await prisma.sectionAttempt.update({
      where: { id: params.sectionAttemptId },
      data: {
        status: 'in_progress',
        startedAt: now,
        remainingSeconds: durationSeconds,
      },
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
            passages: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
      },
    })

    // Update test attempt status if needed
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: sectionAttempt.testAttemptId },
    })
    
    if (testAttempt && testAttempt.status === 'not_started') {
      await prisma.testAttempt.update({
        where: { id: sectionAttempt.testAttemptId },
        data: {
          status: 'in_progress',
          startedAt: now,
        },
      })
    }

    return NextResponse.json({
      sectionAttempt: updated,
      questions: updated.section.questions,
      passages: updated.section.passages,
    })
  } catch (error) {
    console.error('Error starting section:', error)
    return NextResponse.json({ error: 'Failed to start section' }, { status: 500 })
  }
}

