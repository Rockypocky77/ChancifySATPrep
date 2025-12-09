import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/tests/:testId/attempts
 * Creates a new test attempt and associated section attempts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Check if user already has an in-progress attempt
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        testId: params.testId,
        userId,
        status: 'in_progress',
      },
    })

    if (existingAttempt) {
      return NextResponse.json(
        { error: 'An attempt is already in progress', attemptId: existingAttempt.id },
        { status: 409 }
      )
    }

    // Get test with sections
    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      include: {
        sections: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Create test attempt
    const testAttempt = await prisma.testAttempt.create({
      data: {
        userId,
        testId: params.testId,
        status: 'not_started',
        currentSectionId: test.sections[0]?.id || null,
        sectionAttempts: {
          create: test.sections.map((section) => ({
            sectionId: section.id,
            status: 'not_started',
            remainingSeconds: section.durationMinutes * 60,
          })),
        },
      },
      include: {
        sectionAttempts: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                orderIndex: true,
                durationMinutes: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ attempt: testAttempt }, { status: 201 })
  } catch (error) {
    console.error('Error creating attempt:', error)
    return NextResponse.json({ error: 'Failed to create attempt' }, { status: 500 })
  }
}

