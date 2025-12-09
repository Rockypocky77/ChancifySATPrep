import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tests/:testId
 * Returns test details with sections (but not questions to prevent prefetching)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      include: {
        sections: {
          orderBy: {
            orderIndex: 'asc',
          },
          select: {
            id: true,
            name: true,
            orderIndex: true,
            durationMinutes: true,
            instructions: true,
            questionCount: true,
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json({ test })
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 })
  }
}

