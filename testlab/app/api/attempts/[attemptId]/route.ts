import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/attempts/:attemptId
 * Returns full attempt details with sections and scores
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
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
        sectionAttempts: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                orderIndex: true,
                durationMinutes: true,
                questionCount: true,
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

    return NextResponse.json({ attempt })
  } catch (error) {
    console.error('Error fetching attempt:', error)
    return NextResponse.json({ error: 'Failed to fetch attempt' }, { status: 500 })
  }
}

